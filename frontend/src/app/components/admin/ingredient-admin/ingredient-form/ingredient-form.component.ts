import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { map, Observable, startWith } from 'rxjs';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { AdminModule } from '../../admin.module';
import { Ingredient } from '../../../../models/ingredient';
import { Supplier } from '../../../../models/supplier';
import { QuickCreateDialogComponent } from '../../../dialog/quick-create-dialog/quick-create-dialog.component';
import { ImageCarouselComponent } from '../../image-carousel/image-carousel.component';
import { ProcessedImage } from '../../../../models/image';
import { DialogService } from '../../../../services/dialog.service';
import { SharedDataService } from '../../../../services/shared-data.service';

@Component({
  selector: 'app-ingredient-form',
  standalone: true,
  imports: [AdminModule, ImageCarouselComponent],
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
})
export class IngredientFormComponent {
  ingredientForm: FormGroup;

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

  // Sous-ingrédients
  allIngredients: Ingredient[] = [];
  subIngredientCtrl = new FormControl();
  filteredSubIngredients!: Observable<Ingredient[]>;
  // selectedSubIngredients: Ingredient[] = [];
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
    public dialogRef: MatDialogRef<IngredientFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      // imageUrls: string[];
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
          Validators.pattern(/\S+/),
          Validators.pattern(/^[a-zA-ZÀ-ŸŒŒ0-9\s.,'"’()\-@%°&+]*$/),
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


    // const supplier = this.supplier?.value;

    // if (supplier && typeof supplier === 'object') {
    //   this.supplierCtrl.setValue(supplier.name);
    // } else {
    //   this.supplierCtrl.setValue('');
    // }
    this.supplierCtrl.setValue(this.ingredientForm.value.supplier?.name || '');
  }

  ngOnInit(): void {
    this.subscribeToDataUpdates();
    this.setupAutoComplete();
    this.setupBioToggle();
    this.setupSubIngredientsValidator();
    this.updateProcessedImages();
  }

  private subscribeToDataUpdates(): void {
    this.sharedDataService.supplierCreated$.subscribe((newSupplier: Supplier) => {
      if (!newSupplier || !newSupplier._id || !newSupplier.name) {
        this.dialogService.error('❌ Données invalides reçues pour le nouveau fournisseur !');
        return;
      }

      // console.log('🚀 Nouveau fournisseur créé:', newSupplier);
      // console.log(' Type de fournisseur:', typeof newSupplier.name);
      // console.log('contenu complet :', JSON.stringify(newSupplier, null, 2));

      this.suppliers.push(newSupplier);
      this.supplierNotFound = false;

      const label = typeof newSupplier === 'string' ? newSupplier : newSupplier.name;
      console.log('🔵 Valeur de label :', label);
      console.log('🔵 Valeur de supplierCtrl :', this.supplierCtrl.value)
      console.log('🔵 Valeur de newSupplier :', newSupplier);

      this.ingredientForm.patchValue({ supplier: newSupplier });
      this.supplierCtrl.setValue(newSupplier.name);
    });
  }

  private setupBioToggle(): void {
    // console.log('🔵 Initialisation de la règle bio...');
    // Appliquer la règle initialement
    if (this.type?.value === 'compose') {
      this.bio?.disable();
      this.updateBioFromSubIngredients();
    }

    // Réagir aux changements
    this.type?.valueChanges.subscribe((newType: string) => {
      if (newType === 'compose') {
        this.bio?.disable();
        this.updateBioFromSubIngredients();
      } else {
        this.bio?.enable();
      }
    });
  }

  private updateBioFromSubIngredients(): void {
    // console.log('🔵 Mise à jour de la règle bio à partir des sous-ingrédients...');
  const subIngredients: Ingredient[] = this.ingredientForm.get('subIngredients')?.value || [];

  if (subIngredients.length === 0) {
    this.bio?.setValue(false);
    return;
  }

  const allBio = subIngredients.every((ing) => ing.bio === true);
  this.bio?.setValue(allBio);
}


  private setupSubIngredientsValidator(): void {
    this.type?.valueChanges.subscribe((typeValue: string) => {
      const subIngControl = this.ingredientForm.get('subIngredients');
      if (!subIngControl) return;

      if (typeValue === 'compose') {
        subIngControl.setValidators([
          Validators.required,
          Validators.minLength(1)
        ]);
      } else {
        subIngControl.clearValidators();
      }
      subIngControl.updateValueAndValidity();
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
      // console.log('🔵 Valeur de searchedSupplier :', this.searchedSupplier);
      // console.log('🔵 Valeur renvoyées :', value, this.supplier);
      return this.filterItems(value, this.suppliers);
      // const filtered = this.filterItems(value, this.suppliers);
      // this.supplierNotFound = typeof value === 'string' && filtered.length === 0;
      // return filtered;
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
      // const filtered = this.filterItems(value, this.allIngredients);
      // this.subIngredientNotFound = filtered.length === 0;
      // return filtered;
    })
  );
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
    // if (!value) {
    //   return [...list].sort((a, b) => a.name.localeCompare(b.name)); 
    // };

    // // Normaliser la valeur recherchée
    // const normalizedValue = this.normalizeString(value);

    // return list
    //   .filter((item) =>
    //     this.normalizeString(item.name).includes(normalizedValue)
    //   )
    //   .sort((a, b) => a.name.localeCompare(b.name));
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
    // if (!name) return "";
    // return name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  }

  //////////////////////////////////////
  // Ajouter un fournisseur 

  addSupplier(supplier: Supplier | 'supplierNotFound' | null): void {
    console.log('🔵 Ajout du fournisseur :', supplier);
    console.log('🔵 Valeur de searchedSupplier :', this.searchedSupplier);
    if (supplier === 'supplierNotFound') {
      this.createSupplier(this.searchedSupplier);
      this.supplierCtrl.setValue('');
    } else {
      this.ingredientForm.patchValue({ supplier: supplier });
      this.supplierCtrl.setValue(supplier ? supplier.name : '');
    }
  }

  private createSupplier(searchedIngredient: string): void {
    console.log('🔵 Création d\'un nouveau fournisseur avec la valeur :', searchedIngredient);
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

    console.log('données envoyées :', dialogRef.componentInstance.data);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sharedDataService.requestSupplierCreation(result);
        // console.log('🔵 Demande de création de fournisseur envoyée:', result);
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
  onBlurChecks(): void {
    const typeValue = this.type?.value;
    const supplierValue = this.supplier?.value;
    const supplierInput = this.supplierCtrl.value;
    const originControl = this.origins;

    if (!supplierValue) {
      this.supplier?.markAsTouched();

      if (supplierInput && typeof supplierInput === 'string') {
        this.supplier?.setErrors({ invalidSelection: true });
      } else {
        this.supplier?.setErrors({ required: true });
      }
    }

    // Vérifie le champ origine
    if (!originControl?.value) {
      originControl?.setErrors({ required: true });
      originControl?.markAsTouched();
    }

    if (typeValue === 'compose') {
      // Vérifie la sélection de sous-ingrédients
      if (this.subIngredients.length === 0) {
        this.ingredientForm.get('subIngredients')?.setErrors({ required: true });
      } else {
        this.ingredientForm.get('subIngredients')?.setErrors(null);
      }
    }
  }

  clearField(field: 'origin' | 'supplier' | 'subIngredients'): void {
    switch (field) {
      case 'origin':
        this.ingredientForm.get('origin')?.reset();
        break;

      case 'supplier':
        this.supplierCtrl.setValue('');
        this.ingredientForm.get('supplier')?.reset();
        break;

      case 'subIngredients':
        this.subIngredientCtrl.setValue('');
        this.ingredientForm.get('subIngredients')?.reset();
        break;
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

    const name = this.ingredientForm.value.name;
    if (name === '' || name === undefined) return;
    else this.checkNameExists.emit(name);

    // console.log('🔵 Formulaire soumis avec les données :', this.ingredientForm.value);
  }

  validateAndSubmit(): void {
    // console.log('🔵 Validation et soumission du formulaire...');
    let formErrors: string[] = [];

    Object.keys(this.ingredientForm.controls).forEach((field) => {
      const errorMsg = this.getErrorMessage(field);
      if (errorMsg) {
        formErrors.push(errorMsg);
      }
    });

    // console.log('🔵 Erreurs de formulaire détectées :', formErrors);

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
    // console.log('📁 Fichiers sélectionnés :', selectedFiles);

    const existingImages: string[] = this.processedImages
      .filter((img) => img.type === 'existing' && img.path)
      .map((img) => img.path!);
    // console.log('📁 Images existantes :', existingImages);

    const imageOrder: string[] = this.processedImages.map((img) =>
      img.type === 'existing' ? img.path! : img.file!.name
    );
    // console.log('📁 Ordre des images :', imageOrder);

    // update des donnéess à envoyer après close
    const ingredientData = {
      _id: this.data.ingredient?._id,
      ...this.ingredientForm.value,
      name: this.formatNameInput(this.ingredientForm.value.name),
      supplier: formattedSupplier,
      allergens: allergenesSelectionnes,
      // subIngredients: this.selectedSubIngredients.map((ing) => ing._id),
      existingImages: existingImages,
    };
    // console.log('📋 Données de l\'ingrédient à envoyer :', ingredientData);

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
