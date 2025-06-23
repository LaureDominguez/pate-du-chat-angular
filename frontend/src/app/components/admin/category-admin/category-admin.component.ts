import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AdminModule } from '../admin.module';
import { MatTableDataSource } from '@angular/material/table';
import { Category, CategoryService } from '../../../services/category.service';
import { MatPaginator } from '@angular/material/paginator';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { SharedDataService } from '../../../services/shared-data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DEFAULT_CATEGORY } from '../../../models/category';
import { catchError, firstValueFrom, of, Subject, takeUntil, tap } from 'rxjs';
import { DialogService } from '../../../services/dialog.service';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-category-admin',
  imports: [AdminModule],
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.scss', '../admin.component.scss'],
})
export class CategoryAdminComponent implements OnInit, OnDestroy {
  categories = new MatTableDataSource<Category>([]);
  displayedCategoriesColumns: string[] = ['name', 'description', 'productCount', 'actions'];
  categoryForm!: FormGroup;
  newCategory: Category | null = null;
  editingCategoryId: string | null = null;
  editingCategory: Category | null = null;

  highlightedCategoryId: string | null = null;


  isDefaultCategory(category: Category): boolean {
    return category._id === DEFAULT_CATEGORY._id;
  }

  private unsubscribe$ = new Subject<void>(); // Permet de gérer les souscriptions

  @ViewChild('categoriesPaginator') categoriesPaginator!: MatPaginator;
  @ViewChild('categoriesSort') categoriesSort!: MatSort;

  @ViewChild('categoryNameInput') categoryNameInput!: ElementRef;
  @ViewChild('categoryDescriptionInput') categoryDescriptionInput!: ElementRef;

  @Output() countChanged = new EventEmitter<number>();


  constructor(
    private categoryService: CategoryService,
    private productService: ProductService, // Utilisé pour les produits associés
    private fb: FormBuilder,
    // private dialog: MatDialog,
    private sharedDataService: SharedDataService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categories) => {
        if (!categories.some((cat) => cat._id === DEFAULT_CATEGORY._id)) {
          categories.unshift(DEFAULT_CATEGORY);
        }
        this.categories.data = categories;
        this.countChanged.emit(categories.length);
      });

    this.sharedDataService.requestNewCategory$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        this.createNewCategory(data);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    this.categories.paginator = this.categoriesPaginator;
    this.categories.sort = this.categoriesSort;
    this.categories.sortingDataAccessor = (item: Category, property: string): string | number => {
      if (item._id && item._id === this.highlightedCategoryId && item._id !== this.editingCategoryId) {
        return '\u0000';
      }
      return (item as any)[property];
    };
  }

  startEditingCategory(category: Category | null = null, focusField?: 'name' | 'description'): void {
    if (this.editingCategory && this.editingCategory._id === null) {
      return;
    }
    if (this.editingCategory && this.editingCategory._id !== category?._id) {
      return;
    }
    if (category && this.isDefaultCategory(category)) {
      return; 
    }

    const autoFocusField: 'name' | 'description' | undefined = !category && !focusField ? 'name' : focusField;
    this.editingCategory = category ? { ...category } : { _id: null, name: '', description: '' };
    this.editingCategoryId = this.editingCategory?._id || null;

    this.categoryForm = this.fb.group({
      name: [
        this.editingCategory.name,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/\S+/),
          Validators.pattern(/^[a-zA-ZÀ-ŸŒŒ0-9\s.,'"’()\-@%°&+]*$/),
        ],
      ],
      description: [
        this.editingCategory.description,
        [
          Validators.maxLength(100),
          Validators.pattern(/\S+/),
          Validators.pattern(/^[a-zA-ZÀ-ŸŒŒ0-9\s.,'"’()\-@%°&+]*$/),
        ]
      ]
    });
    if (!this.editingCategory._id) {
      this.categories.data = [this.editingCategory, ...this.categories.data];
    }
    this.focusCategoryInput(autoFocusField);
  }
  
  focusCategoryInput(focusField?: 'name' | 'description'): void {
    setTimeout(() => {
      if (focusField === 'name' && this.categoryNameInput) {
        this.categoryNameInput.nativeElement.focus();
      } else if (focusField === 'description' && this.categoryDescriptionInput) {
        this.categoryDescriptionInput.nativeElement.focus();
      }
    });
  }

  cancelEditingCategory(event?: FocusEvent): void {
    const relatedTarget = event?.relatedTarget as HTMLElement;

    if (relatedTarget && relatedTarget.closest('.editing-mode')) {
      return;
    }
    setTimeout(() => {
      this.editingCategory = null;
      this.editingCategoryId = null;
      this.categories.data = this.categories.data.filter(cat => cat._id !== null);
    }, 0);
  }

  formatNameInput(name: string): string {
    if (!name) return "";
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  }
  
  //Save
  saveCategory(category: Category): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const newCategory: Category = {
      name: this.formatNameInput(this.categoryForm.get('name')?.value),
      description: this.formatNameInput(this.categoryForm.get('description')?.value),
    };

    const isUpdate = !!category._id;
    const request$ = isUpdate
      ? this.categoryService.updateCategory(category._id!, newCategory)
      : this.categoryService.createCategory(newCategory);

    request$.pipe(
    tap((savedCategory) => {
      this.dialogService.info(
        isUpdate ? 'Catégorie mise à jour avec succès.' : 'Catégorie créée avec succès.'
      );
      this.highlightedCategoryId = isUpdate ? null : savedCategory._id || null;
      this.editingCategoryId = null;
      this.editingCategory = null;
    }),
    catchError((error) => {
      this.cancelEditingCategory();
      this.dialogService.showHttpError(error);
      return of(null);
    })
  ).subscribe();
    this.sharedDataService.notifyCategoryUpdate();
    this.categories.sort!.active = 'name';
    this.categories.sort!.direction = 'asc';
    this.categories.sort!.sortChange.emit(); // ⚡️ Re-déclenche le tri
  }

  // Création depuis product-Form
  private createNewCategory(data: {name: string; description?: string}): void {
    const newCategory: Category = { 
      _id: null, 
      name: this.formatNameInput(data.name),
      description: data.description || '',
    };

    this.categoryService
      .createCategory(newCategory)
      .subscribe({
        next: (createdCategory) => {
          this.dialogService.info(
            'Catégorie créée avec succès.',
          );
          this.sharedDataService.sendCategoryToProductForm(createdCategory);
          this.highlightedCategoryId = createdCategory._id || null;
        },
        error: (error) => {
          this.dialogService.showHttpError(error);
      }
    });
  }

  deleteCategory(category: Category): void {
    this.checkProductsInCategory(category)
  }
  private async checkProductsInCategory(
    category: Category,
    canRetry: boolean = true
  ): Promise<void> {
    if (this.isDefaultCategory(category)) {
      this.dialogService.info('Vous ne pouvez pas supprimer la catégorie "Sans catégorie".');
      return;
    }
    const productCount = category.productCount || 0;
    const message = productCount > 0
      ? `Cette catégorie contient <b>${productCount} produit(s)</b>.<br>
          Êtes-vous sûr de vouloir supprimer la catégorie : <br>
          <b>"${category.name}"</b> ?`
      : `Êtes-vous sûr de vouloir supprimer cette catégorie : <br> <b>"${category.name}"</b> ?`;

    const result = await firstValueFrom(
      this.dialogService.confirm(message, {
        title: 'Suppression de catégorie',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        extraText: productCount > 0 ? 'Voir les produits' : undefined,
      })
    );
    // .subscribe(result => {
    if (result === 'cancel') return;
    if (result === 'extra' && canRetry) {
      await this.showRelatedProducts(category);
      return this.checkProductsInCategory(category, false);
    }

      this.categoryService.deleteCategory(category._id!).subscribe({
        next: () => {
          this.dialogService.info('Catégorie supprimée avec succès.');
          this.sharedDataService.notifyCategoryUpdate(); // Optionnel si reload
        },
        error: (err) => {
          this.dialogService.showHttpError(err);
        }
      });
    // });
  }

  private async showRelatedProducts(category: Category): Promise<void> {
    try {
      const products = await firstValueFrom(
        this.productService.getProductsByCategory(category._id!)
      );
      if (!products.length) {
        await firstValueFrom(
          this.dialogService.info('Aucun produit associé à cette catégorie.'
          , 'Produits associés')
        );
        return;
      }
      const productNames = products.map((p) => `<li>${p.name}</li>`).join('');
      await firstValueFrom(
      this.dialogService.info(
        `Produits associés à la catégorie <b>"${category.name}"</b>:<br>${productNames}`,
        'Produits associés')
      );
    } catch (error) {
      this.dialogService.error('Erreur lors de la récupération des produits liés.');
    }
  }
}
