import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Inject, OnDestroy, Output, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { Ingredient } from '../../../../models/ingredient';
import { Supplier } from '../../../../models/supplier';
import { QuickCreateDialogComponent } from '../../../dialog/quick-create-dialog/quick-create-dialog.component';
import { ImageCarouselComponent } from '../../image-carousel/image-carousel.component';
import { ProcessedImage } from '../../../../models/image';
import { DialogService } from '../../../../services/dialog.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { ADMIN_SHARED_IMPORTS } from '../../admin-material';
import { MATERIAL_IMPORTS } from '../../../../app-material';
import { MatAutocomplete } from '@angular/material/autocomplete';

@Component({
  selector: 'app-ingredient-form',
  imports: [MATERIAL_IMPORTS, ADMIN_SHARED_IMPORTS, ImageCarouselComponent],
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
})
export class IngredientFormComponent implements OnDestroy, AfterViewInit {
  ingredientForm: FormGroup;
  private SAFE_TEXT =/^(?!.*(?:<|>|<\/?script\b|on\w+\s*=))[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Zs}\r\n\t]+$/u


  private destroy$ = new Subject<void>();

  @ViewChild('supplierAuto') supplierAuto!: MatAutocomplete;

  @Output() downloadImage = new EventEmitter<{ imagePath: string; objectName: string }>()
  @Output() checkNameExists = new EventEmitter<string>();
  @Output() formValidated = new EventEmitter<{
    ingredientData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
    imageOrder: string[];
  }>();

  // Fournisseurs
  suppliers: Supplier[] = [];
  supplierCtrl = new FormControl();
  filteredSuppliers!: Observable<Supplier[]>;
  creatingSupplier: boolean = false;
  searchedSupplier: string = '';
  supplierNotFound: boolean = false;

  displaySupplier = (value: Supplier | string | null): string =>
  typeof value === 'string' ? value ?? '' : (value?.name ?? '');


  // Sous-ingrédients
  allIngredients: Ingredient[] = [];
  subIngredientCtrl = new FormControl();
  filteredSubIngredients!: Observable<Ingredient[]>;
  subIngredientNotFound: boolean = false;
  
  // Images
    selectedFiles: File[] = [];
    removedExistingImages: string[] = [];
    processedImages: ProcessedImage[] = [];

  constructor(
    private fb: FormBuilder,
    private sharedDataService: SharedDataService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<IngredientFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      ingredient: Ingredient | null;
      allergenesList: string[];
      suppliers: Supplier[];
      originesList: { label: string; options: string[] }[];
      searchedValue: string;
      ingredients: Ingredient[];
      imageUrls: string[];
      imagePaths: string[];
    }
  ) {
    this.suppliers = data.suppliers || [];
    this.allIngredients = data.ingredients || [];

    if (
      data.imageUrls &&
      data.imagePaths &&
      data.imageUrls.length === data.imagePaths.length
    ) {
      this.processedImages = data.imageUrls.map((url, index) => ({
        type: 'existing',
        data: url,
        path: data.imagePaths[index],
        originalIndex: index,
      }));
    }

    this.ingredientForm = this.fb.group({
      name: [
        data.ingredient?.name || data.searchedValue || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(this.SAFE_TEXT),
        ],
      ],
      bio: [
        { 
          value: data.ingredient?.bio || false, 
          disabled: data.ingredient?.type === 'compose' 
        }
      ], // ✅ Désactiver si composé
      supplier: [
        data.ingredient?.supplier || '',
        [Validators.required],
      ],
      type: [data.ingredient?.type || 'simple'],
      subIngredients: [data.ingredient?.subIngredients || []],
      allergens: this.fb.array(
        data.allergenesList.map((allergen) =>
          this.fb.control(
            data.ingredient?.allergens.includes(allergen) || false
          )
        )
      ),
      origin: [
        data.ingredient?.origin || '',
        [Validators.required],
      ],
      vegan: [data.ingredient?.vegan || false],
      vegeta: [data.ingredient?.vegeta || false],
      images: [data.ingredient?.images || []],
    });
    this.supplierCtrl.setValue(this.ingredientForm.value.supplier?.name || '',
    { emitEvent: false }) ;
  }

  ngOnInit(): void {
    this.subscribeToDataUpdates();
    this.setupAutoComplete();
    this.setupBioToggle();
    this.setupSubIngredientsValidator();
    this.updateProcessedImages();
    this.setupSupplierSync(); 
  }

  ngAfterViewInit(): void {
    // Diffère l’application de l’état initial à une micro-tâche
    queueMicrotask(() => {
      const isCompose = this.type?.value === 'compose';

      if (isCompose) {
        this.bio?.disable({ emitEvent: false });
        this.updateBioFromSubIngredients();
      } else {
        this.bio?.enable({ emitEvent: false });
      }

      // Si tu valides subIngredients quand 'compose', applique les validators initiaux aussi :
      const subIngControl = this.ingredientForm.get('subIngredients');
      if (isCompose && subIngControl) {
        subIngControl.setValidators([Validators.required, Validators.minLength(1)]);
        subIngControl.updateValueAndValidity({ emitEvent: false });
      }

      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private subscribeToDataUpdates(): void {
    this.sharedDataService.supplierCreated$
    .pipe(takeUntil(this.destroy$))
    .subscribe((newSupplier: Supplier) => {
      if (!newSupplier || !newSupplier._id || !newSupplier.name) {
        this.dialogService.error('❌ Données invalides reçues pour le nouveau fournisseur');
        return;
      }

      this.suppliers.push(newSupplier);
      this.supplierNotFound = false;

      // const label = typeof newSupplier === 'string' ? newSupplier : newSupplier.name;

      this.ingredientForm.patchValue({ supplier: newSupplier });
      this.supplierCtrl.setValue(newSupplier.name);
    });
  }

  private setupBioToggle(): void {
      this.type?.valueChanges
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe((newType: 'simple' | 'compose') => {
      if (newType === 'compose') {
        this.bio?.disable({ emitEvent: false });
        this.updateBioFromSubIngredients();
      } else {
        this.bio?.enable({ emitEvent: false });
      }
      this.cdr.markForCheck();
    });
    // // Appliquer la règle initialement
    // if (this.type?.value === 'compose') {
    //   this.bio?.disable();
    //   this.updateBioFromSubIngredients();
    // }

    // // Réagir aux changements
    // this.type?.valueChanges.subscribe((newType: string) => {
    //   if (newType === 'compose') {
    //     this.bio?.disable();
    //     this.updateBioFromSubIngredients();
    //   } else {
    //     this.bio?.enable();
    //   }
    // });
  }

  private updateBioFromSubIngredients(): void {
    const subIngredients: Ingredient[] = this.ingredientForm.get('subIngredients')?.value || [];

    if (subIngredients.length === 0) {
      this.bio?.setValue(false);
      return;
    }

    const allBio = subIngredients.every((ing) => ing.bio === true);
    this.bio?.setValue(allBio);
  }


  private setupSubIngredientsValidator(): void {
    this.type?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((typeValue: string) => {
        const subCtrl = this.ingredientForm.get('subIngredients');
        if (!subCtrl) return;

        if (typeValue === 'compose') {
          subCtrl.setValidators([Validators.required, Validators.minLength(1)]);
          // Applique l’état d’erreur si vide
          const empty = !this.subIngredients || this.subIngredients.length === 0;
          if (empty) {
            subCtrl.setErrors({ required: true });
            this.subIngredientCtrl.setErrors({ required: true });
          } else {
            subCtrl.setErrors(null);
            this.subIngredientCtrl.setErrors(null);
          }
          subCtrl.updateValueAndValidity({ emitEvent: false });
        } else {
          subCtrl.clearValidators();
          subCtrl.setErrors(null);
          this.subIngredientCtrl.setErrors(null);
          subCtrl.updateValueAndValidity({ emitEvent: false });
        }
      });
  }

  
  get name() {
    return this.ingredientForm.get('name');
  }

  get bio () {
    return this.ingredientForm.get('bio');
  }

  get type() {
    return this.ingredientForm.get('type');
  }

  get subIngredients(): Ingredient[] {
    return this.ingredientForm.get('subIngredients')?.value || [];
  }

  get allergens(): FormArray {
    return this.ingredientForm.get('allergens') as FormArray;
  }

  get supplier() {
    return this.ingredientForm.get('supplier');
  }  

  get origins() {
    return this.ingredientForm.get('origin') ;
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////////////// Innit du formulaire

  ///////// AutoComplete ///////////
private setupAutoComplete(): void {
  // Fournisseurs
  this.filteredSuppliers = this.supplierCtrl.valueChanges.pipe(
    startWith(''),
    map((value) => {
      if (typeof value === 'string' && value != 'supplierNotFound') {
        this.searchedSupplier = value.trim();
        this.supplierNotFound = this.filterItems(value, this.suppliers).length === 0;
      }
      return this.filterItems(value, this.suppliers);
    })
  );

  // Sous-ingrédients
  this.filteredSubIngredients = this.subIngredientCtrl.valueChanges.pipe(
    startWith(''),
    map((value) => {
      if (typeof value === 'string' && value != 'subIngredientNotFound') {
        // this.searchedSubIngredient = value.trim();
        this.subIngredientNotFound = this.filterItems(value, this.allIngredients).length === 0;
      }
      return this.filterItems(value, this.allIngredients);
    })
  );
}

private setupSupplierSync(): void {
  // Quand l’utilisateur tape / choisit
  this.supplierCtrl.valueChanges
    .pipe(startWith(this.supplierCtrl.value),
      debounceTime(0),                // laisse l’UI respirer, évite des doubles émissions
      takeUntil(this.destroy$)
    )
    .subscribe((val: string | Supplier | null) => {
      // Cas 1: sélection d'une option => objet Supplier
      if (val && typeof val === 'object' && (val as Supplier)._id) {
        this.supplier?.setValue(val, { emitEvent: false });
        this.supplier?.setErrors(null);
        this.supplierCtrl.setErrors(null);
        return;
      }

      // Cas 2: saisie texte => on tente une correspondance exacte sur le nom
      const text = (typeof val === 'string' ? val : '')?.trim();

      if (!text) {
        this.supplier?.setValue(null, { emitEvent: false });
        this.supplier?.setErrors({ required: true });
        this.supplierCtrl.setErrors({ required: true });
        return;
      }

      const match = this.suppliers.find(
        s => this.normalizeString(s.name) === this.normalizeString(text)
      );

      if (match) {
        this.supplier?.setValue(match, { emitEvent: false });
        this.supplier?.setErrors(null);
        this.supplierCtrl.setErrors(null); 
      } else {
        this.supplier?.setValue(null, { emitEvent: false });
        this.supplier?.setErrors({ invalidSelection: true });
        this.supplierCtrl.setErrors({ invalidSelection: true }); 
      }
    });
}


  //// Tri et filtrage avec tolérance aux accents
  private filterItems(value: string, list: any[]): any[] {
        if (!value) return list;

    // Normaliser la valeur recherchée
    const normalizedValue = this.normalizeString(value);

    return list
      .filter((item) =>
        this.normalizeString(item.name).includes(normalizedValue)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  //// Fonction de normalisation des accents et ligatures
  private normalizeString(str: string): string {
    if (typeof str !== 'string') return ''; // Vérifie que c'est bien une string, sinon retourne une chaîne vide

    return str
      .normalize('NFD') // Décompose les caractères accentués (ex: Œ → O + E, É → E + ´)
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .toLowerCase() // Convertit en minuscules
      .trim(); // Supprime les espaces inutiles
  }

  ///// Fonction de normalisation des noms
  formatNameInput(name: string): string {
    if (!name) return '';
    let trimmedName = name.replace(/\s+/g, ' ').trim();
    return (
      trimmedName.trim().charAt(0).toUpperCase() + trimmedName.trim().slice(1)
    );
  }

  //////////////////////////////////////
  // Ajouter un fournisseur 

  addSupplier(supplier: Supplier | 'supplierNotFound' | null): void {
    if (supplier === 'supplierNotFound') {
      this.createSupplier(this.searchedSupplier);
      this.supplierCtrl.setValue('');
    } else {
      this.ingredientForm.patchValue({ supplier: supplier });
      this.supplierCtrl.setValue(supplier ? supplier.name : '');
    }
  }

  private createSupplier(searchedIngredient: string): void {
    const dialogRef = this.dialog.open(QuickCreateDialogComponent, {
      data: {
        title: 'Créer un nouveau fournisseur',
        fields: [
          { 
            name: 'name', 
            label: 'Nom du fournisseur', 
            required: true,
            maxLength: 50,
            pattern: /^[a-zA-ZÀ-ÿŒœ0-9\s.,'"’()\-@%°&+]*$/,
            defaultValue: this.formatNameInput(searchedIngredient)
          },
          { 
            name: 'description', 
            label: 'Description du fournisseur', 
            maxLength: 100,
            pattern: /^[a-zA-ZÀ-ÿŒœ0-9\s.,'"’()\-@%°&+]*$/,
          },
        ]
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sharedDataService.requestSupplierCreation(result);
      }
    })
  }
  

  //////////////////////////////////////
 /////////// Gestion des sous-ingrédients
  private updateSubIngredients(ingredient: Ingredient, add: boolean): void {
    const currentSubIngredients = this.subIngredients;
    this.setSubIngredients(
      add
        ? [...currentSubIngredients, ingredient]
        : currentSubIngredients.filter((ing) => ing._id !== ingredient._id)
    );

    this.subIngredientCtrl.setValue('');
    if (this.type?.value === 'compose') {
      this.updateBioFromSubIngredients();
      const subCtrl = this.ingredientForm.get('subIngredients');
      const empty = !this.subIngredients || this.subIngredients.length === 0;
      if (empty) {
        subCtrl?.setErrors({ required: true });
        this.subIngredientCtrl.setErrors({ required: true });
      } else {
        subCtrl?.setErrors(null);
        this.subIngredientCtrl.setErrors(null);
      }
    }
  }

  private setSubIngredients(ingredients: Ingredient[]): void {
    this.ingredientForm.get('subIngredients')?.setValue(ingredients);
  }

  isSubIngredientSelected(ingredient: Ingredient): boolean {
    return this.subIngredients.some((ing) => ing._id === ingredient._id);
  }

  addSubIngredient(ingredient: Ingredient): void {
    if (!this.subIngredients.some((ing) => ing._id === ingredient._id)) {
      this.updateSubIngredients(ingredient, true);
    }
  }

  removeSubIngredient(ingredient: Ingredient): void {
    this.updateSubIngredients(ingredient, false);
  }

  // ✅ Gestion du tooltip des ingrédients
getIngredientTooltip(ingredient: Ingredient): string {
  return `Allergènes : ${ingredient.allergens?.join(', ') || 'Aucun'}\n` +
    `Végétarien : ${ingredient.vegeta ? 'Oui' : 'Non'}\n` +
    `Vegan : ${ingredient.vegan ? 'Oui' : 'Non'}`;
}


  onVeganChange(isVeganChecked: boolean): void {
    if (isVeganChecked) {
      this.ingredientForm.get('vegeta')?.setValue(true);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  ///////////// Gestion des erreurs
  onSupplierBlur(): void {
    // force l’évaluation finale et l’affichage des erreurs au blur
    const val = this.supplierCtrl.value;
    const text = (typeof val === 'string' ? val : '')?.trim();

    if (!text && !this.supplier?.value) {
      this.supplier?.setValue(null, { emitEvent: false });
      this.supplier?.setErrors({ required: true });
      this.supplierCtrl.setErrors({ required: true }); // miroir
    }

    this.supplier?.markAsTouched();
    this.supplierCtrl.markAsTouched();
  }

  onSubIngredientBlur(): void {
  const subCtrl = this.ingredientForm.get('subIngredients');
  // Valide seulement si type = compose
  if (this.type?.value === 'compose') {
    const empty = !this.subIngredients || this.subIngredients.length === 0;
    if (empty) {
      subCtrl?.setErrors({ required: true });
      this.subIngredientCtrl.setErrors({ required: true }); // miroir pour le mat-form-field
    } else {
      subCtrl?.setErrors(null);
      this.subIngredientCtrl.setErrors(null);
    }
    subCtrl?.markAsTouched();
    this.subIngredientCtrl.markAsTouched();
  } else {
    // En "simple", on ne requiert rien
    subCtrl?.setErrors(null);
    this.subIngredientCtrl.setErrors(null);
  }
}


  clearField(field: 'origin' | 'supplier' | 'subIngredients'): void {
    switch (field) {
      case 'origin':
        this.ingredientForm.get('origin')?.reset();
        break;

      case 'supplier':
        this.supplierCtrl.setValue('');
        this.supplierCtrl.setErrors(null);
        this.ingredientForm.get('supplier')?.reset();
        this.ingredientForm.get('supplier')?.setErrors(null);

        queueMicrotask(() => this.supplierAuto?.options.forEach(o => o.deselect()));
        break;

      case 'subIngredients': {
        this.subIngredientCtrl.setValue('');
        break;
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// Gestion des images
    updateProcessedImages(): void {
    this.processedImages = this.processedImages.map((img, index) => ({
      ...img,
      originalIndex: index,
    }));
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const maxSize = 10 * 1024 * 1024;
    const errors: string[] = [];

    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} n'est pas une image.`);
        return;
      }

      if (file.size > maxSize) {
        errors.push(`${file.name} dépasse 10 Mo.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.processedImages.push({
          type: 'preview',
          data: reader.result as string,
          file: file,
          originalIndex: this.processedImages.length,
        });
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0) {
      this.dialogService.error(errors.join('<br>'));
    }
    input.value = '';
  }

  onRemoveImage(image: ProcessedImage): void {
    const index = this.processedImages.indexOf(image);
    if (index !== -1) {
      this.processedImages.splice(index, 1);
      if (image.type === 'existing' && image.path) {
        this.removedExistingImages.push(image.path);
      }
    }
  }

  onReorderImages(images: ProcessedImage[]): void {
    this.processedImages = [...images];
  }

  onDownloadImage(imageUrl: string): void {
    const ingredientName = this.data.ingredient?.name || 'Ingrédient';
    this.downloadImage.emit({imagePath: imageUrl, objectName: ingredientName});
  }

  save(): void {
    Object.values(this.ingredientForm.controls).forEach((control) => {
      control.markAsTouched(); // Marque tous les champs comme touchés
    });
    if (this.ingredientForm.invalid) {
      return;
    }
    const name = this.ingredientForm.value.name;
    if (name === '' || name === undefined) return;
    else this.checkNameExists.emit(name);
  }

  validateAndSubmit(): void {
    let formErrors: string[] = [];

    Object.keys(this.ingredientForm.controls).forEach((field) => {
      const errorMsg = this.getErrorMessage(field);
      if (errorMsg) {
        formErrors.push(errorMsg);
      }
    });

    if (formErrors.length > 0) {
      this.dialogService.error(formErrors.join('<br>'));
      return;
    }

    // si vegan, alors vegetarian aussi
    if (this.ingredientForm.get('vegan')?.value) {
      this.ingredientForm.get('vegeta')?.setValue(true);
    }

    // si pas d'allergene, alors allergens = false
    const allergenesSelectionnes = this.allergens.value
      .map((checked: boolean, index: number) =>
        checked ? this.data.allergenesList[index] : null
      )
      .filter((allergene: string | null) => allergene !== null);

    // Formatage du nom du fournisseur
    const supplier = this.supplier?.value;
    const formattedSupplier = supplier
      ? { ...supplier, name: this.formatNameInput(supplier.name) }
      : null;

    // traitement des images
    const selectedFiles: File[] = this.processedImages
      .filter((img) => img.type === 'preview' && img.file)
      .map((img) => img.file!); // `!` car on a déjà filtré

    const existingImages: string[] = this.processedImages
      .filter((img) => img.type === 'existing' && img.path)
      .map((img) => img.path!);

    const imageOrder: string[] = this.processedImages.map((img) =>
      img.type === 'existing' ? img.path! : img.file!.name
    );

    // update des donnéess à envoyer après close
    const ingredientData = {
      _id: this.data.ingredient?._id,
      ...this.ingredientForm.value,
      name: this.formatNameInput(this.ingredientForm.value.name),
      supplier: formattedSupplier,
      allergens: allergenesSelectionnes,
      existingImages: existingImages,
    };

    this.formValidated.emit({
      ingredientData,
      selectedFiles,
      removedExistingImages: this.removedExistingImages,
      imageOrder
    });
  }

  private fieldLabels: { [key: string]: string } = {
    name: 'Nom',
    supplier: 'Fournisseur',
    bio: 'Bio',
    type: 'Type',
    subIngredients: 'Sous-ingrédients',
    allergens: 'Allergènes',
    origin: 'Origine',
    vegan: 'Vegan',
    vegeta: 'Végétarien',
  };

  private getErrorMessage(controlName: string): string | null {
    const control = this.ingredientForm.get(controlName);
    if (!control || control.valid || !control.errors) return null;

    const label = this.fieldLabels[controlName] || controlName;
    if (control.hasError('required'))
      return `Le champ "${label}" est obligatoire.`;
    if (control.hasError('minlength'))
      return `Le champ "${label}" doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`;
    if (control.hasError('maxlength'))
      return `Le champ "${label}" ne peut pas dépasser ${control.errors['maxlength'].requiredLength} caractères.`;
    if (control.hasError('pattern'))
      return `Le champ "${label}" contient des caractères non autorisés.`;
    if (control.hasError('min'))
      return `Le champ "${label}" doit être un nombre positif.`;
    return null;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
