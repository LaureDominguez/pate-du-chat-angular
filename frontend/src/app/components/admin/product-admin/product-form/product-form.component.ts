import { Component, ElementRef, EventEmitter, Inject, OnInit, Output, ViewChild }from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith, take } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { AdminModule } from '../../admin.module';
import { DialogService } from '../../../../services/dialog.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { Category } from '../../../../models/category';
import { Ingredient } from '../../../../models/ingredient';
import { Product } from '../../../../models/product';
import { QuickCreateDialogComponent } from '../../../dialog/quick-create-dialog/quick-create-dialog.component';
import { ImageCarouselComponent } from '../../image-carousel/image-carousel.component';
import { ProcessedImage } from '../../../../models/image';

import autoAnimate from '@formkit/auto-animate';

@Component({
  selector: 'app-product-form',
  imports: [AdminModule, ImageCarouselComponent],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;

  @ViewChild('stockSection') stockSection!: ElementRef;
  @ViewChild('dlcContainer') dlcContainer!: ElementRef;

  @Output() checkNameExists = new EventEmitter<string>();
  @Output() formValidated = new EventEmitter<{
    productData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
    imageOrder: string[];
  }>();


  //Categories
  categories: Category[] = [];
  categoryCtrl = new FormControl();
  filteredCategories!: Observable<Category[]>;
  creatingCategory: boolean = false;
  searchedCategory: string = '';
  categoryNotFound: boolean = false;

  //Ingredients
  ingredients: Ingredient[] = [];
  ingredientCtrl = new FormControl();
  filteredIngredients!: Observable<Ingredient[]>;
  searchedIngredient: string = '';
  ingredientNotFound: boolean = false;

  //DLCs
  dlcsList: string[] = [];
  @ViewChild('customDlcInput') customDlcInput!: ElementRef<HTMLInputElement>;

  //Images
  selectedFiles: File[] = [];
  removedExistingImages: string[] = [];
  processedImages: ProcessedImage[] = [];

  constructor(
    private fb: FormBuilder,
    private sharedDataService: SharedDataService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      product: Product | null;
      categories: Category[];
      ingredients: Ingredient[];
      imageUrls: string[];
      imagePaths: string[];
      dlcs: string[];
    }
  ) {
    this.categories = data.categories || [];
    this.ingredients = data.ingredients || [];
    this.dlcsList = data.dlcs || [];

  // console.log('data :', data); // debug

    const existingDlc = data.product?.dlc || '';
    const isCustom = existingDlc && !this.dlcsList.includes(existingDlc);

    if (
      data.imageUrls &&
      data.imagePaths &&
      data.imageUrls.length === data.imagePaths.length
    ) {
      // console.log('📋 data.imageUrls :', data.imageUrls);
      this.processedImages = data.imageUrls.map((url, index) => ({
        type: 'existing',
        data: url,
        path: data.imagePaths[index],
        originalIndex: index,
      }));
    }

    this.productForm = this.fb.group({
      _id: [data.product?._id || ''],
      name: [
        data.product?.name || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/\S+/),
          Validators.pattern(/^[a-zA-ZÀ-ŸŒŒ0-9\s.,'"’()\-@%°&+]*$/),
        ],
      ],
      category: [
        data.product?.category || '', 
        [Validators.required]
      ],
      description: [
        data.product?.description || '',
        [
          Validators.maxLength(500),
          Validators.pattern(/\S+/),
          Validators.pattern(
            /^(?=.*\S)[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/
          ),
        ],
      ],
      composition: [
        data.product?.composition || [],
        [Validators.required, Validators.minLength(1)],
      ],
      dlc: [
        isCustom ? 'Autre' : existingDlc || '',
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(/\S+/),
          Validators.pattern(
            /^(?=.*\S)[0-9]{1,2}(\/[0-9]{1,2}(\/[0-9]{2,4})?)?$|^[a-zA-ZÀ-ÿŒœ0-9\s.,;:'"()\-]+$/
          ),
        ],
      ],
      customDlc: [
        isCustom ? existingDlc : '',
        [
          Validators.maxLength(50),
          Validators.pattern(/\S+/),
          Validators.pattern(
            /^(?=.*\S)[0-9]{1,2}(\/[0-9]{1,2}(\/[0-9]{2,4})?)?$|^[a-zA-ZÀ-ÿŒœ0-9\s.,;:'"()\-]+$/
          ),
        ],
      ],
      cookInstructions: [
        data.product?.cookInstructions || '',
        [
          Validators.required,
          Validators.maxLength(250),
          Validators.pattern(/\S+/),
          Validators.pattern(
            /^(?=.*\S)[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/
          ),
        ],
      ],
      stock: [data.product?.stock || false],
      stockQuantity: [
        data.product?.stockQuantity !== null &&
          data.product?.stockQuantity !== undefined
          ? data.product?.stockQuantity
          : null,
        [
          Validators.required,
          Validators.pattern(/\S+/),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.min(0),
        ],
      ],
      quantityType: [
        data.product?.quantityType || 'kg',
        [Validators.required, Validators.pattern(/^(piece|kg)$/)],
      ],
      price: [
        data.product?.price !== null && data.product?.price !== undefined
          ? data.product?.price
          : null,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/\S+/),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      images: [data.product?.images || []],
    });

    this.categoryCtrl.setValue(this.productForm.value.category?.name || '');
  }

  ngOnInit(): void {
    this.setupAutoComplete();
    this.subscribeToDataUpdates();
    this.updateProcessedImages();
    this.updateStockToggleState();

    this.productForm.get('stockQuantity')?.valueChanges.subscribe(() => {
      this.updateStockToggleState(); // Réévalue à chaque changement
    });

    this.dlc?.valueChanges.subscribe((value) => {
      if (value === 'Autre') {
        setTimeout(() => {
          this.customDlcInput?.nativeElement.focus();
        }, 0);
      }
    });

    this.productForm.get('quantityType')?.valueChanges.subscribe((value) => {
      const stockCtrl = this.productForm.get('stockQuantity');
      // console.log('📋 Type de quantité :', value); // LOG ICI 🔍
      if (value === 'piece') {
        // console.log('📋 pieces :', stockCtrl?.value); // LOG ICI 🔍
        stockCtrl?.setValidators([
          Validators.required,
          Validators.pattern(/^\d+$/),
        ]);
      } else {
        // console.log('📋 kg :', stockCtrl?.value); // LOG ICI 🔍
        stockCtrl?.setValidators([
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ]);
      }
      stockCtrl?.updateValueAndValidity();
    });
  }

  ngAfterViewInit(): void {
    if (this.stockSection) autoAnimate(this.stockSection.nativeElement);
    if (this.dlcContainer) autoAnimate(this.dlcContainer.nativeElement);
  }

  get name() {
    return this.productForm.get('name');
  }

  get category() {
    return this.productForm.get('category');
  }

  get description() {
    return this.productForm.get('description');
  }

  get composition(): Ingredient[] {
    return this.productForm.get('composition')?.value || [];
  }

  get dlc() {
    return this.productForm.get('dlc');
  }

  get customDlc() {
    return this.productForm.get('customDlc');
  }

  get cookInstructions() {
    return this.productForm.get('cookInstructions');
  }

  get stock() {
    return this.productForm.get('stock');
  }

  get stockQuantity() {
    return this.productForm.get('stockQuantity');
  }

  get quantityType() {
    return this.productForm.get('quantityType')?.value === 'piece'
      ? 'pièce(s)'
      : 'kg';
  }

  get price() {
    return this.productForm.get('price');
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////////////// Innit du formulaire

  ///////// AutoComplete ///////////
  private setupAutoComplete(): void {
    // Categories
    this.filteredCategories = this.categoryCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string' && value !== 'categoryNotFound') {
          this.searchedCategory = value.trim();
          this.categoryNotFound =
            this.filterItems(value, this.categories).length === 0;
        }
        return this.filterItems(value, this.categories);
      })
    );

    // Ingredients
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string' && value !== 'ingredientNotFound') {
          this.searchedIngredient = value.trim();
          this.ingredientNotFound =
            this.filterItems(value, this.ingredients).length === 0;
        }
        return this.filterItems(value, this.ingredients);
      })
    );
  }

  // toggle du bouton stock
  private updateStockToggleState(): void {
    const stockCtrl = this.stock;
    const value = this.stockQuantity?.value;
    const numericValue = parseFloat(value);

    const shouldEnable =
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !isNaN(numericValue) &&
      numericValue > 0;

    if (shouldEnable) {
      stockCtrl?.enable({ emitEvent: false });
    } else {
      stockCtrl?.setValue(false, { emitEvent: false });
      stockCtrl?.disable({ emitEvent: false });
    }
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

  ////// Autocomplete des champs price et stock
  setDefaultIfEmpty(controlName: string): void {
    const control = this.productForm.get(controlName);
    const value = control?.value;

    if (control && (value === null || value === undefined || value === '')) {
      control?.setValue(0);
    }
  }

  //////////////////////////////////////
  //// Ecoute de shared-data
  private subscribeToDataUpdates(): void {
    this.sharedDataService.categoryCreated$.subscribe((newCategory) =>
      this.updateList(newCategory, this.categories, 'category')
    );
    this.sharedDataService.ingredientCreated$.subscribe((newIngredient) =>
      this.updateList(newIngredient, this.ingredients, 'ingredient')
    );
  }

  private updateList(
    newItem: any,
    list: any[],
    type: 'category' | 'ingredient'
  ): void {
    if (!list.some((item) => item._id === newItem._id)) {
      list.push(newItem);
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    this.productForm.patchValue({ [type]: newItem });
    if (type === 'category') {
      this.categoryCtrl.setValue(newItem.name);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  ///////////Gestion des categories
  addCategory(category: Category | 'categoryNotFound' | null): void {
    if (category === 'categoryNotFound') {
      this.createCategory(this.searchedCategory);
      this.categoryCtrl.setValue('');
    } else {
      this.productForm.patchValue({ category: category });
      this.categoryCtrl.setValue(category ? category.name : '');
    }
  }

  private createCategory(searchedValue: string): void {
    const dialogRef = this.dialog.open(QuickCreateDialogComponent, {
      data: {
        title: 'Créer une nouvelle catégorie',
        fields: [
          {
            name: 'name',
            label: 'Nom de la catégorie',
            required: true,
            maxLength: 50,
            pattern: /^[a-zA-ZÀ-ÿŒœ0-9\s.,'"’()\-@%°&+]*$/,
            defaultValue: this.formatNameInput(searchedValue),
          },
          {
            name: 'description',
            label: 'Description de la catégorie',
            maxLength: 100,
            pattern: /^[a-zA-ZÀ-ÿŒœ0-9\s.,'"’()\-@%°&+]*$/,
          },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sharedDataService.requestCategoryCreation(result);
      // console.log('📋 Catégorie créée :', result);
      }
    });
  }
  
  onCategoryBlur(): void {
    const inputValue = this.categoryCtrl.value;
    const selectedCategory = this.productForm.get('category')?.value;

    if (!selectedCategory) {
      this.category?.markAsTouched();

      // Cas 1 : texte saisi mais aucun choix sélectionné
      if (inputValue && typeof inputValue === 'string') {
        this.category?.setErrors({ invalidSelection: true });
      }
      // Cas 2 : champ vide
      else {
        this.category?.setErrors({ required: true });
      }
    }
  }

  clearCategory(): void {
    this.categoryCtrl.setValue('');
    this.productForm.get('category')?.reset();
  }




  /////////////////////////////////////////////////////////////////////////////////
  ////////// Gestion des ingrédients
  private updateComposition(ingredient: Ingredient, add: boolean): void {
    const currentComposition = this.composition;
    this.setComposition(
      add
        ? [...currentComposition, ingredient]
        : currentComposition.filter((comp) => comp._id !== ingredient._id)
    );

    this.ingredientCtrl.setValue('');
  }

  private setComposition(composition: Ingredient[]): void {
    this.productForm.get('composition')?.setValue(composition);
  }

  // Vérifie si un ingrédient fait partie de la composition
  isIngredientSelected(ingredient: Ingredient): boolean {
    return this.composition.some((comp) => comp._id === ingredient._id);
  }

  // Ajout d'un ingrédient à la composition + gestion des coches
  addIngredient(ingredient: Ingredient | 'ingredientNotFound'): void {
    // console.log('product-form -> addIngredient -> ingredient :', ingredient);

    if (ingredient === 'ingredientNotFound') {
      this.createIngredient(this.searchedIngredient);
      this.ingredientCtrl.setValue('');
      return;
    }

    const alreadyExists = this.composition.some(
      (comp) => comp._id === ingredient._id
    );

    if (alreadyExists) {
      this.removeIngredient(ingredient);
      return;
    } else {
      this.updateComposition(ingredient, true);
    }
    this.ingredientCtrl.setValue('');
  }

  // Création d'un nouvel ingrédient
  private createIngredient(searchedValue: string): void {
    const filteredValue = this.formatNameInput(searchedValue);
    this.openIngredientForm(filteredValue)
      .then((newIngredient) => {
        if (!this.composition.some((comp) => comp._id === newIngredient._id)) {
          this.updateComposition(newIngredient, true);
        }
      })
      .catch((error) => {
        this.dialogService.error(`Une erreur est survenue lors de la création de l’ingrédient :<br><b>"${error}"</b>.`);
      });
  }

  private openIngredientForm(searchedValue: string): Promise<Ingredient> {
    this.sharedDataService.requestOpenIngredientForm(searchedValue);
    return new Promise((resolve, reject) => {
      this.sharedDataService.ingredientCreated$.pipe(take(1)).subscribe({
        next: (ingredient) => resolve(ingredient),
        error: (err) => reject(err),
      });
    });
  }

  // Suppression d'un ingrédient de la composition
  removeIngredient(ingredient: Ingredient): void {
    this.updateComposition(ingredient, false);
  }

  clearIngredientSearch(): void {
    this.ingredientCtrl.setValue('');
  }


  getIngredientTooltip(ingredient: Ingredient): string {
    return `Allergènes : ${ingredient.allergens?.join(', ') || 'Aucun'}\n
    Végétarien : ${ingredient.vegeta ? 'Oui' : 'Non'}\n
    Vegan : ${ingredient.vegan ? 'Oui' : 'Non'}\n
    Origine : ${ingredient.origin}\n
    Label BIO : ${ingredient.bio ? 'Oui' : 'Non'}`;
  }

  onIngredientBlur(): void {
    const typedValue = this.ingredientCtrl.value;
    const currentComposition = this.composition;

    if (currentComposition.length === 0) {
      // Cas 1 : l'utilisateur a écrit mais n'a rien sélectionné
      if (typedValue && typeof typedValue === 'string') {
        this.productForm.get('composition')?.setErrors({ invalidSelection: true });
      } else {
        // Cas 2 : il n'a rien fait du tout
        this.productForm.get('composition')?.setErrors({ required: true });
      }

      this.productForm.get('composition')?.markAsTouched();
    }
  }


  /////////////////////////////////////////////////////////////////////////////////
  // ///////////////////////// Gestion des images
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

  downloadImage(imageUrl: string): void {
    const productName = this.data.product?.name || 'Produit';
    this.sharedDataService.emitDownloadImage(imageUrl, productName);
  }

  onImageRemoved(image: ProcessedImage): void {
    const index = this.processedImages.findIndex(
      (img) => img.data === image.data
    );
    if (index === -1) return;

    this.processedImages.splice(index, 1);

    if (image.type === 'existing' && image.path) {
      this.removedExistingImages.push(image.path);
    }

    if (image.type === 'preview' && image.file) {
      const fileIndex = this.selectedFiles.findIndex((f) => f === image.file);
      if (fileIndex !== -1) this.selectedFiles.splice(fileIndex, 1);
    }
  }

  onReorder(images: ProcessedImage[]): void {
    this.processedImages = [...images];
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////////////// Validation du formulaire
  save(): void {
  // console.log('📋 Formulaire soumis :', this.productForm.value);

    Object.values(this.productForm.controls).forEach(control => {
      control.markAsTouched();
      // this.categoryCtrl.markAsTouched();
      // this.ingredientCtrl.markAsTouched();
    });

    const name = this.productForm.value.name;
    // console.log("📋 Vérification de l'existence du nom :", name);
    if (name === '' || name === undefined) return;
    else this.checkNameExists.emit(name);
  }

  validateStockAndPrice(): void {
    // const stockControl = this.productForm.get('stockQuantity');
    const stockValue = this.stockQuantity?.value;

    if (stockValue === null || stockValue === undefined || stockValue === '') {
      const message = `Le champ "Quantité en stock" est vide. <br> Souhaitez-vous le remplir avec 0 ? <br> <i>Le produit ne sera pas visible dans le catalogue tant que la quantité en stock est à 0.</i>`;

      this.dialogService.confirm(message, {
        title: 'Stock vide',
        confirmText: 'Oui',
        cancelText: 'Non',
      }).subscribe((result) => {
        if (result === 'confirm') {
          this.stockQuantity?.setValue(0);
          this.validateAndSubmit();
        }
      });

    } else {
      this.validateAndSubmit();
    }
  }

  validateAndSubmit(): void {
    // vérifier si le champ stockQuantity
    const quantity = this.productForm.get('stockQuantity')?.value;
    if (!quantity || parseFloat(quantity) === 0) {
      this.productForm.get('stock')?.setValue(false);
    }

    let errors: string[] = [];

    Object.keys(this.productForm.controls).forEach((field) => {
      const errorMsg = this.getErrorMessage(field);
      if (errorMsg) errors.push(errorMsg);
    });

    if (errors.length > 0) {
      this.dialogService.error(errors.join('<br>'));
      return;
    }

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

    const productData = {
      ...this.productForm.value,
      name: this.formatNameInput(this.productForm.value.name),
      dlc:
        this.dlc?.value === 'Autre' ? this.customDlc?.value : this.dlc?.value,
      existingImages: existingImages,
      stock: this.stock?.value,
    };

  // console.log('📋 Données du produit avant envoi :', productData)

    this.formValidated.emit({
      productData,
      selectedFiles,
      removedExistingImages: this.removedExistingImages,
      imageOrder,
    });


    // this.dialogRef.close({
    //   productData,
    //   selectedFiles,
    //   removedExistingImages: this.removedExistingImages,
    //   imageOrder,
    // });
  }

  formatNameInput(name: string): string {
    if (!name) return '';
    let trimmedName = name.replace(/\s+/g, ' ').trim();
    return (
      trimmedName.trim().charAt(0).toUpperCase() + trimmedName.trim().slice(1)
    );
  }

  private fieldLabels: { [key: string]: string } = {
    name: 'Nom',
    category: 'Catégorie',
    description: 'Description',
    composition: 'Composition',
    dlc: 'DLC',
    cookInstructions: 'Instructions de cuisson',
    stock: 'Stock',
    stockQuantity: 'Quantité en stock',
    quantityType: 'Type de quantité',
    price: 'Prix',
  };

  private getErrorMessage(controlName: string): string | null {
    const control = this.productForm.get(controlName);
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
