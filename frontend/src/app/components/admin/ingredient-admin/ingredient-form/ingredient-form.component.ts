import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { AdminModule } from '../../admin.module';
import { InfoDialogComponent } from '../../../dialog/info-dialog/info-dialog.component';
import { Ingredient } from '../../../../models/ingredient';
import { SharedDataService } from '../../../../services/shared-data.service';
import { map, Observable, startWith, Subject } from 'rxjs';
import { Supplier } from '../../../../models/supplier';
import { QuickCreateDialogComponent } from '../../../dialog/quick-create-dialog/quick-create-dialog.component';

@Component({
  selector: 'app-ingredient-form',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
})
export class IngredientFormComponent {
  ingredientForm: FormGroup;

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
  filePreviews: string[] = [];
  existingImages: string[] = [];
  existingImageUrls: string[] = [];
  removedExistingImages: string[] = [];

  ////////////////// je sais pas ce que c'est ???
  @Output() downloadImageEvent = new EventEmitter<string>();

  constructor(
    private fb: FormBuilder,
    private sharedDataService: SharedDataService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<IngredientFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imageUrls: string[];
      ingredient: Ingredient | null;
      allergenesList: string[];
      suppliers: Supplier[];
      originesList: { label: string; options: string[] }[];
      searchedValue: string;
      ingredients: Ingredient[];
    }
  ) {
    console.log('📢 Données reçues dans ingredient-form:', this.data);
    // console.log('✅ Origines reçues:', this.data.originesList);

    this.suppliers = data.suppliers || [];
    this.allIngredients = data.ingredients || [];

    this.ingredientForm = this.fb.group({
      name: [
        data.ingredient?.name || data.searchedValue || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"%°\-]+$/),
        ],
      ],
      bio: [
        { 
          value: data.ingredient?.bio || false, 
          disabled: data.ingredient?.type === 'compose' 
        }
      ], // ✅ Désactiver si composé
      supplier: [
        data.ingredient?.supplier || null,
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
      origin: [data.ingredient?.origin || ''],
      vegan: [data.ingredient?.vegan || false],
      vegeta: [data.ingredient?.vegeta || false],
    });

    // Charger les images existantes si l'ingrédient est fourni
    if (data.ingredient?.images) {
      this.existingImages = [...data.ingredient.images];
      this.existingImageUrls = [...data.imageUrls];
    }

    // if (data.ingredient?.subIngredients) {
    //   this.selectedSubIngredients = [...data.ingredient.subIngredients];
    // }

    console.log('🚀 ingredient-form -> onInit -> Ingrédient mis à jour :', data.ingredient);
    // console.log('liste des suppliers :', this.suppliers);

    const supplier = this.supplier?.value;

    if (supplier && typeof supplier === 'object') {
      this.supplierCtrl.setValue(supplier.name);
    } else {
      this.supplierCtrl.setValue('');
    }
  }

  ngOnInit(): void {
    this.setupAutoComplete();

    this.sharedDataService.supplierCreated$.subscribe((newSupplier: Supplier) => {
      console.log('🚀 Nouveau fournisseur créé:', newSupplier);
      console.log(' Type de fournisseur:', typeof newSupplier.name);
      console.log('contenu complet :', JSON.stringify(newSupplier, null, 2));

      if (!newSupplier || !newSupplier._id || !newSupplier.name) {
        console.warn('❌ Données invalides reçues pour le nouveau supplier !');
      }

      this.suppliers.push(newSupplier);
      this.supplierNotFound = false;

      
      const label = typeof newSupplier === 'string' ? newSupplier : newSupplier.name;
      console.log('🔵 Valeur envoyée à supplierCtrl :', label);

      this.supplierCtrl.setValue(newSupplier.name);
      this.ingredientForm.patchValue({ supplier: newSupplier });
    })

    // Désactiver "bio" si l'ingrédient est "compose"
    this.type?.valueChanges.subscribe((newType: string) => {
      if (newType === 'compose') {
        this.bio?.disable();
        this.bio?.setValue(false); // S'assure que bio est désactivé
      } else {
        this.bio?.enable();
      }
    });

    // // Vérifier au chargement si le champ doit être désactivé
    if (this.type?.value === 'compose') {
      this.bio?.disable();
    }  
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
        if (typeof value === 'string' && value !== 'supplierNotFound') {
          this.searchedSupplier = value.trim();
          this.supplierNotFound =
            this.filterItems(value, this.suppliers).length === 0;
        }
        return this.filterItems(value, this.suppliers);
      })
    );

    // Sous-ingrédients
    this.filteredSubIngredients = this.subIngredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const results = this.filterItems(value, this.allIngredients);
        this.subIngredientNotFound = results.length === 0; // ✅ Gestion du message "Aucun ingrédient trouvé"
        return results.sort((a, b) => a.name.localeCompare(b.name));
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
    if (!name) return "";
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  }

  //////////////////////////////////////
  // Ajouter un fournisseur 

  addSupplier(supplier: Supplier | 'supplierNotFound' | null): void {
    if (supplier === 'supplierNotFound') {
      this.createSupplier(this.searchedSupplier);
    } else {
      this.ingredientForm.patchValue({ supplier: supplier });
      this.supplierCtrl.setValue(supplier?.name || 'Sans fournisseur');
    }
  }

  private createSupplier(searchedValue: string): void {
    const dialogRef = this.dialog.open(QuickCreateDialogComponent, {
      data: {
        title: 'Créer un nouveau fournisseur',
        fields: [
          { 
            name: 'name', 
            label: 'Nom du fournisseur', 
            required: true,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9À-ÿŒœ\s-']+$/,
            defaultValue: this.formatNameInput(searchedValue)
          },
          { 
            name: 'description', 
            label: 'Description du fournisseur', 
            maxLength: 100,
            pattern: /^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/,
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



  // // ✅ Ajouter un sous-ingrédient
  // addSubIngredient(ingredient: Ingredient): void {
  //   if (!this.selectedSubIngredients.includes(ingredient)) {
  //     this.selectedSubIngredients.push(ingredient);
  //     this.subIngredientCtrl.setValue(''); // Réinitialise le champ de recherche
  //   }
  // }

  // // ✅ Supprimer un sous-ingrédient
  // removeSubIngredient(ingredient: Ingredient): void {
  //   const index = this.selectedSubIngredients.indexOf(ingredient);
  //   if (index >= 0) {
  //     this.selectedSubIngredients.splice(index, 1);
  //   }
  // }

  // // ✅ Vérifier si un ingrédient est déjà sélectionné
  // isSubIngredientSelected(ingredient: Ingredient): boolean {
  //   return this.selectedSubIngredients.some(
  //     (ing) => ing._id === ingredient._id
  //   );
  // }

  // ✅ Gestion du tooltip des ingrédients
  getIngredientTooltip(ingredient: Ingredient): string {
    return `Allergènes : ${ingredient.allergens?.join(', ') || 'Aucun'}\n
    Végétarien : ${ingredient.vegeta ? 'Oui' : 'Non'}\n
    Vegan : ${ingredient.vegan ? 'Oui' : 'Non'}`;
  }

  onVeganChange(isVeganChecked: boolean): void {
    if (isVeganChecked) {
      this.ingredientForm.get('vegeta')?.setValue(true);
    }
  }


  /////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// Gestion des images
  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    const maxFileSize = 10 * 1024 * 1024;

    if (input.files) {
      const validFiles = Array.from(input.files).filter((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} n'est pas une image valide.`);
          return false;
        } else if (file.size > maxFileSize) {
          alert(`${file.name} dépasse la taille maximale autorisée de 10 Mo.`);
          return false;
        }
        return true;
      });
      validFiles.forEach((file) => {
        this.handleImagePreview(file);
        if (validFiles.length > 0) {
          input.value = '';
          this.selectedFiles.push(...validFiles);
        }
      });
    }
  }
  // Gérer la preview
  private handleImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        this.filePreviews.push(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  downloadImage(imagePath: string): void {
    console.log('📢 Événement envoyé pour télécharger :', imagePath);
    let ingredientName = this.data.ingredient?.name || 'Ingredient';
    this.sharedDataService.emitDownloadImage(imagePath, ingredientName);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.existingImageUrls.splice(index, 1);
    const removed = this.existingImages.splice(index, 1)[0];
    this.removedExistingImages.push(removed);
  }

  save(): void {
    let formErrors: string[] = [];

    Object.keys(this.ingredientForm.controls).forEach((field) => {
      const errorMsg = this.getErrorMessage(field);
      if (errorMsg) {
        formErrors.push(errorMsg);
      }
    });

    if (formErrors.length > 0) {
      this.dialog.open(InfoDialogComponent, {
        data: {
          message: formErrors.join('<br>'),
          type: 'error',
        },
      });
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

    // update des donnéess à envoyer après close
    const ingredientData = {
      _id: this.data.ingredient?._id,
      ...this.ingredientForm.value,
      name: this.formatNameInput(this.ingredientForm.value.name),
      supplier: formattedSupplier,
      allergens: allergenesSelectionnes,
      // subIngredients: this.selectedSubIngredients.map((ing) => ing._id),
      existingImages: this.existingImages,
    };

    // envoi des données et fermuture du dialog
    this.dialogRef.close({
      ingredientData,
      selectedFiles: this.selectedFiles,
      removedExistingImages: this.removedExistingImages,
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
