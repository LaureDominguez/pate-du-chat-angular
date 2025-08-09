import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  OnInit,
  OnDestroy,
  Output,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  Observable,
  Subject,
  startWith,
  map,
  takeUntil,
  debounceTime,
  take,
} from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { DialogService } from '../../../../services/dialog.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { Category } from '../../../../models/category';
import { Ingredient } from '../../../../models/ingredient';
import { Product } from '../../../../models/product';
import { QuickCreateDialogComponent } from '../../../dialog/quick-create-dialog/quick-create-dialog.component';
import { ImageCarouselComponent } from '../../image-carousel/image-carousel.component';
import { ProcessedImage } from '../../../../models/image';

import autoAnimate from '@formkit/auto-animate';
import { ADMIN_SHARED_IMPORTS } from '../../admin-material';
import { MATERIAL_IMPORTS } from '../../../../app-material';
import { MatAutocomplete } from '@angular/material/autocomplete';

@Component({
  selector: 'app-product-form',
  imports: [MATERIAL_IMPORTS, ADMIN_SHARED_IMPORTS, ImageCarouselComponent],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit, OnDestroy, AfterViewInit {
  productForm: FormGroup;

  private destroy$ = new Subject<void>();

  @ViewChild('stockSection') stockSection!: ElementRef;
  @ViewChild('dlcContainer') dlcContainer!: ElementRef;
  @ViewChild('customDlcInput') customDlcInput!: ElementRef<HTMLInputElement>;
  @ViewChild('categoryAuto') categoryAuto!: MatAutocomplete;

  @Output() downloadImage = new EventEmitter<{ imagePath: string; objectName: string }>();
  @Output() checkNameExists = new EventEmitter<string>();
  @Output() formValidated = new EventEmitter<{
    productData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
    imageOrder: string[];
  }>();

  // Catégories (UI + data)
  categories: Category[] = [];
  categoryCtrl = new FormControl<string | Category>('');
  filteredCategories!: Observable<Category[]>;
  creatingCategory = false;
  searchedCategory = '';
  categoryNotFound = false;

  displayCategory = (v: Category | string | null) =>
    typeof v === 'string' ? (v ?? '') : (v?.name ?? '');


  // Ingrédients (UI + data)
  ingredients: Ingredient[] = [];
  ingredientCtrl = new FormControl<string | Ingredient>('');
  filteredIngredients!: Observable<Ingredient[]>;
  searchedIngredient = '';
  ingredientNotFound = false;

  displayIngredient = (v: Ingredient | string | null) =>
    typeof v === 'string' ? (v ?? '') : (v?.name ?? '');

  // DLC
  dlcsList: string[] = [];

  // Images
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

    const existingDlc = data.product?.dlc || '';
    const isCustom = !!existingDlc && !this.dlcsList.includes(existingDlc);

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
      category: [data.product?.category || '', [Validators.required]],
      description: [
        data.product?.description || '',
        [
          Validators.maxLength(500),
          Validators.pattern(/\S+/),
          Validators.pattern(/^(?=.*\S)[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/),
        ],
      ],
      composition: [
        data.product?.composition || [],
        [Validators.required, Validators.minLength(1)],
      ],
      dlc: [
        isCustom ? 'Autre' : existingDlc || '',
        [Validators.required, Validators.maxLength(50), Validators.pattern(/\S+/)],
      ],
      customDlc: [
        isCustom ? existingDlc : '',
        [Validators.maxLength(50), Validators.pattern(/\S+/)],
      ],
      cookInstructions: [
        data.product?.cookInstructions || '',
        [
          Validators.maxLength(250),
          Validators.pattern(/\S+/),
          Validators.pattern(/^(?=.*\S)[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/),
        ],
      ],
      forSale: [data.product?.forSale || false],
      stockQuantity: [
        data.product?.stockQuantity ?? null,
        [Validators.min(0)], // pattern appliqué selon quantityType ci-dessous
      ],
      quantityType: [
        data.product?.quantityType || 'kg',
        [Validators.required, Validators.pattern(/^(piece|kg)$/)],
      ],
      price: [
        data.product?.price ?? null,
        [Validators.required, Validators.min(0)],
      ],
      images: [data.product?.images || []],
    });

    // Validators dynamiques pour stockQuantity
    this.applyStockQuantityValidators(this.productForm.get('quantityType')?.value as string);

    // Initialiser les inputs d’autocomplete sans déclencher les valueChanges
    this.categoryCtrl.setValue(this.productForm.value.category || '', { emitEvent: false });
    this.ingredientCtrl.setValue('', { emitEvent: false });
  }

  // ---------------- Lifecycle ----------------

  ngOnInit(): void {
    this.setupAutoComplete();
    this.setupCategorySync();
    this.setupDlcValidators();
    this.subscribeToDataUpdates();
    this.updateProcessedImages();
    this.updateStockToggleState();

    this.productForm.get('stockQuantity')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateStockToggleState());

    this.productForm.get('quantityType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.applyStockQuantityValidators(value as string));
  }

  ngAfterViewInit(): void {
    if (this.stockSection) autoAnimate(this.stockSection.nativeElement);
    if (this.dlcContainer) autoAnimate(this.dlcContainer.nativeElement);
    // Application initiale après premier rendu
    queueMicrotask(() => this.updateStockToggleState());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------- Getters (tests s’en servent) ----------------

  get name() { return this.productForm.get('name'); }
  get category() { return this.productForm.get('category'); }
  get description() { return this.productForm.get('description'); }
  get dlc() { return this.productForm.get('dlc'); }
  get customDlc() { return this.productForm.get('customDlc'); }
  get cookInstructions() { return this.productForm.get('cookInstructions'); }
  get forSale() { return this.productForm.get('forSale'); }
  get stockQuantity() { return this.productForm.get('stockQuantity'); }
  get price() { return this.productForm.get('price'); }
  get quantityType() { return this.productForm.get('quantityType')?.value === 'piece' ? 'pièce(s)' : 'kg'; }
  get composition(): Ingredient[] { return this.productForm.get('composition')?.value || []; }

  // ---------------- Autocomplete (UI lists) ----------------

  private setupAutoComplete(): void {
    // Catégories
    this.filteredCategories = this.categoryCtrl.valueChanges.pipe(
      startWith(this.categoryCtrl.value || ''),
      map((value) => {
        if (typeof value === 'string' && value !== 'categoryNotFound') {
          this.searchedCategory = value.trim();
          this.categoryNotFound = this.filterItems(value, this.categories).length === 0;
        }
        return this.filterItems(value as string, this.categories);
      })
    );

    // Ingrédients
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(this.ingredientCtrl.value || ''),
      map((value) => {
        if (typeof value === 'string' && value !== 'ingredientNotFound') {
          this.searchedIngredient = value.trim();
          this.ingredientNotFound = this.filterItems(value as string, this.ingredients).length === 0;
        }
        return this.filterItems(value as string, this.ingredients);
      })
    );
  }

  private filterItems(value: string, list: any[]): any[] {
    if (!value) return list;
    const normalizedValue = this.normalizeString(value);
    return list
      .filter((item) => this.normalizeString(item.name).includes(normalizedValue))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private normalizeString(str: string): string {
    if (typeof str !== 'string') return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  // ---------------- Stock & Quantity ----------------

  private applyStockQuantityValidators(quantityType: string): void {
    const stockCtrl = this.productForm.get('stockQuantity');
    if (!stockCtrl) return;

    const validators = [Validators.min(0)];
    if (quantityType === 'piece') {
      validators.push(Validators.pattern(/^\d+$/));              // entier
    } else {
      validators.push(Validators.pattern(/^\d+(\.\d{1,2})?$/));  // décimal 2 chiffres
    }
    stockCtrl.setValidators(validators);
    stockCtrl.updateValueAndValidity({ emitEvent: false });
  }

  // appelé aussi dans les tests via ['updateStockToggleState']
  private updateStockToggleState(): void {
    const stockCtrl = this.forSale;
    const value = this.stockQuantity?.value;
    const numericValue = parseFloat(value);

    const shouldEnable =
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !isNaN(numericValue) &&
      numericValue >= 0;

    if (shouldEnable) {
      stockCtrl?.enable({ emitEvent: false }); // 0 ou >0 : toggle actif
    } else {
      stockCtrl?.setValue(false, { emitEvent: false });
      stockCtrl?.disable({ emitEvent: false });
    }
  }

  // ---------------- SharedData sync ----------------

  private subscribeToDataUpdates(): void {
    this.sharedDataService.categoryCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((newCategory) => this.updateList(newCategory, this.categories, 'category'));

    this.sharedDataService.ingredientCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((newIngredient) => this.updateList(newIngredient, this.ingredients, 'ingredient'));
  }

  private updateList(newItem: any, list: any[], type: 'category' | 'ingredient'): void {
    if (!list.some((item) => item._id === newItem._id)) {
      list.push(newItem);
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    this.productForm.patchValue({ [type]: newItem }, { emitEvent: false });
    if (type === 'category') {
      this.categoryCtrl.setValue(newItem); // laisse setupCategorySync propager proprement
      return;
    }
  }

  // ---------------- Catégorie (UI ↔ métier) ----------------

  private setupCategorySync(): void {
    this.categoryCtrl.valueChanges
      .pipe(startWith(this.categoryCtrl.value), debounceTime(0), takeUntil(this.destroy$))
      .subscribe((val: string | Category | null) => {
        if (val && typeof val === 'object' && (val as Category)._id) {
          this.category?.setValue(val, { emitEvent: false });
          this.category?.setErrors(null);
          this.categoryCtrl.setErrors(null);
          return;
        }

        const text = (typeof val === 'string' ? val : '')?.trim();
        if (!text) {
          this.category?.setValue(null, { emitEvent: false });
          this.category?.setErrors({ required: true });
          this.categoryCtrl.setErrors({ required: true });
          return;
        }

        const match = this.categories.find(
          (c) => this.normalizeString(c.name) === this.normalizeString(text)
        );
        if (match) {
          this.category?.setValue(match, { emitEvent: false });
          this.category?.setErrors(null);
          this.categoryCtrl.setErrors(null);
        } else {
          this.category?.setValue(null, { emitEvent: false });
          this.category?.setErrors({ invalidSelection: true });
          this.categoryCtrl.setErrors({ invalidSelection: true });
        }
      });
  }

  addCategory(category: Category | 'categoryNotFound' | null): void {
    if (category === 'categoryNotFound') {
      this.createCategory(this.searchedCategory);
      this.categoryCtrl.setValue('');
      return;
    } 
    this.categoryCtrl.setValue(category ?? '');
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
      if (result) this.sharedDataService.requestCategoryCreation(result);
    });
  }

  onCategoryBlur(): void {
    if (!this.category?.value) {
      this.category?.markAsTouched();
      this.categoryCtrl.markAsTouched();
    }
  }

clearCategory(): void {
  // reset visibles + form
  this.categoryCtrl.setValue('', { emitEvent: true });
  this.categoryCtrl.setErrors(null);
  this.category?.reset(null, { emitEvent: false });
  this.category?.setErrors(null);

  // 👇 force la désélection visuelle dans le panel
  queueMicrotask(() => this.categoryAuto?.options.forEach(o => o.deselect()));
}

  // ---------------- Ingrédients / Composition ----------------

  private touchCompositionRequiredState(): void {
    const ctrl = this.productForm.get('composition');
    const hasAny = (this.composition?.length ?? 0) > 0;
    if (!hasAny) {
      ctrl?.setErrors({ required: true });
      this.ingredientCtrl.setErrors({ required: true });
    } else {
      ctrl?.setErrors(null);
      this.ingredientCtrl.setErrors(null);
    }
    ctrl?.markAsTouched();
  }

  private updateComposition(ingredient: Ingredient, add: boolean): void {
    const currentComposition = this.composition;
    const next = add
      ? [...currentComposition, ingredient]
      : currentComposition.filter((comp) => comp._id !== ingredient._id);

    this.productForm.get('composition')?.setValue(next, { emitEvent: false });
    this.ingredientCtrl.setValue('', { emitEvent: false });
    this.touchCompositionRequiredState();
  }

  isIngredientSelected(ingredient: Ingredient): boolean {
    return this.composition.some((comp) => comp._id === ingredient._id);
  }

  addIngredient(ingredient: Ingredient | 'ingredientNotFound'): void {
    if (ingredient === 'ingredientNotFound') {
      this.createIngredient(this.searchedIngredient);
      this.ingredientCtrl.setValue('', { emitEvent: false });
      return;
    }

    const alreadyExists = this.isIngredientSelected(ingredient);
    this.updateComposition(ingredient, !alreadyExists);
  }

  removeIngredient(ingredient: Ingredient): void {
    this.updateComposition(ingredient, false);
  }

  private createIngredient(searchedValue: string): void {
    const filteredValue = this.formatNameInput(searchedValue);
    this.openIngredientForm(filteredValue)
      .then((newIngredient) => {
        if (!this.isIngredientSelected(newIngredient)) {
          this.updateComposition(newIngredient, true);
        }
      })
      .catch((error) => {
        this.dialogService.error(
          `Une erreur est survenue lors de la création de l’ingrédient :<br><b>"${error}"</b>.`
        );
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

  clearIngredientSearch(): void {
    this.ingredientCtrl.setValue('', { emitEvent: false });
    this.ingredientCtrl.setErrors(null);
  }

  getIngredientTooltip(ingredient: Ingredient): string {
    return `Allergènes : ${ingredient.allergens?.join(', ') || 'Aucun'}\n` +
      `Végétarien : ${ingredient.vegeta ? 'Oui' : 'Non'}\n` +
      `Vegan : ${ingredient.vegan ? 'Oui' : 'Non'}\n` +
      `Origine : ${ingredient.origin}\n` +
      `Label BIO : ${ingredient.bio ? 'Oui' : 'Non'}`;
  }

  onIngredientBlur(): void {
    this.touchCompositionRequiredState();
  }

  // ---------------- DLC conditionnelle ----------------

  private setupDlcValidators(): void {
    this.dlc?.valueChanges
      .pipe(startWith(this.dlc?.value), takeUntil(this.destroy$))
      .subscribe((value) => {
        const custom = this.customDlc;
        if (!custom) return;

        if (value === 'Autre') {
          custom.setValidators([Validators.maxLength(50), Validators.pattern(/\S+/)]);
          custom.updateValueAndValidity({ emitEvent: false });
          // focus input custom
          setTimeout(() => this.customDlcInput?.nativeElement?.focus(), 0);
        } else {
          custom.clearValidators();
          custom.setValue('', { emitEvent: false });
          custom.updateValueAndValidity({ emitEvent: false });
        }
      });
  }

  // ---------------- Images ----------------

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
          file,
          originalIndex: this.processedImages.length,
        });
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0) this.dialogService.error(errors.join('<br>'));
    input.value = '';
  }

  onDownloadImage(imageUrl: string): void {
    const productName = this.data.product?.name || 'Produit';
    this.downloadImage.emit({ imagePath: imageUrl, objectName: productName });
  }

  onImageRemoved(image: ProcessedImage): void {
    const index = this.processedImages.findIndex((img) => img.data === image.data);
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

  // ---------------- Validation & Submit ----------------

  save(): void {
    Object.values(this.productForm.controls).forEach((control) => control.markAsTouched());
    if (this.productForm.invalid) return;

    const name = this.productForm.value.name;
    if (!name) return;
    this.checkNameExists.emit(name);
  }

  validateAndSubmit(): void {
    const quantity = this.stockQuantity?.value;
    if (quantity === null || quantity === undefined || quantity === '') {
      this.stockQuantity?.setValue(null, { emitEvent: false });
    }

    const errors: string[] = [];
    Object.keys(this.productForm.controls).forEach((field) => {
      const errorMsg = this.getErrorMessage(field);
      if (errorMsg) errors.push(errorMsg);
    });
    if (errors.length > 0) {
      this.dialogService.error(errors.join('<br>'));
      return;
    }

    const selectedFiles: File[] = this.processedImages
      .filter((img) => img.type === 'preview' && img.file)
      .map((img) => img.file!);

    const existingImages: string[] = this.processedImages
      .filter((img) => img.type === 'existing' && img.path)
      .map((img) => img.path!);

    const imageOrder: string[] = this.processedImages.map((img) =>
      img.type === 'existing' ? img.path! : img.file!.name
    );

    const productData = {
      ...this.productForm.value,
      name: this.formatNameInput(this.productForm.value.name),
      dlc: this.dlc?.value === 'Autre' ? this.customDlc?.value : this.dlc?.value,
      existingImages,
      forSale: this.forSale?.value,
    };

    this.formValidated.emit({
      productData,
      selectedFiles,
      removedExistingImages: this.removedExistingImages,
      imageOrder,
    });
  }

  formatNameInput(name: string): string {
    if (!name) return '';
    const trimmed = name.replace(/\s+/g, ' ').trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  private fieldLabels: { [key: string]: string } = {
    name: 'Nom',
    category: 'Catégorie',
    description: 'Description',
    composition: 'Composition',
    dlc: 'DLC',
    customDlc: 'DLC personnalisée',
    cookInstructions: 'Instructions de cuisson',
    forSale: 'En vente',
    stockQuantity: 'Quantité en stock',
    quantityType: 'Type de quantité',
    price: 'Prix',
  };

  private getErrorMessage(controlName: string): string | null {
    const control = this.productForm.get(controlName);
    if (!control || control.valid || !control.errors) return null;

    const label = this.fieldLabels[controlName] || controlName;
    if (control.hasError('required')) return `Le champ "${label}" est obligatoire.`;
    if (control.hasError('minlength')) return `Le champ "${label}" doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`;
    if (control.hasError('maxlength')) return `Le champ "${label}" ne peut pas dépasser ${control.errors['maxlength'].requiredLength} caractères.`;
    if (control.hasError('pattern')) return `Le champ "${label}" contient des caractères non autorisés.`;
    if (control.hasError('min')) return `Le champ "${label}" doit être un nombre positif.`;
    return null;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
