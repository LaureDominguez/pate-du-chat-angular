import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { catchError, of, Subject, takeUntil, tap } from 'rxjs';

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

  isDefaultCategory(category: Category): boolean {
    return category._id === DEFAULT_CATEGORY._id;
  }

  private unsubscribe$ = new Subject<void>(); // Permet de gérer les souscriptions

  @ViewChild('categoriesPaginator') categoriesPaginator!: MatPaginator;
  @ViewChild('categoriesSort') categoriesSort!: MatSort;

  @ViewChild('categoryNameInput') categoryNameInput!: ElementRef;
  @ViewChild('categoryDescriptionInput') categoryDescriptionInput!: ElementRef;


  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit(): void {
    // console.log('📋 CategoryAdmin → INIT');

    // Écoute les catégories mises à jour via le BehaviorSubject
    this.categoryService.getCategories()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categories) => {
        // console.log('[CATEGORY ADMIN] 🔄 categories$ subscription triggered:', categories);
        if (!categories.some((cat) => cat._id === DEFAULT_CATEGORY._id)) {
          categories.unshift(DEFAULT_CATEGORY);
        }
        this.categories.data = categories;
      });

    // Écoute les nouvelles catégories envoyées par product-form
    // console.log('👂 category-admin -> abonnement au requestNewCategory$');

    this.sharedDataService.requestNewCategory$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        // console.log('📋 category-admin -> Demande de création de catégorie :', data);
        this.createNewCategory(data);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    // console.log('[CATEGORY ADMIN] 💥 ngOnDestroy');
  }

  ngAfterViewInit(): void {
    this.categories.paginator = this.categoriesPaginator;
    this.categories.sort = this.categoriesSort;
    // console.log('[CATEGORY ADMIN] 👀 ngAfterViewInit');
  }

  // Méthodes pour gérer les catégories
  startEditingCategory(category: Category | null = null, focusField?: 'name' | 'description'): void {
    if (this.editingCategory && this.editingCategory._id === null) {
      // console.warn('⚠️ Ignoré : une ligne de création est déjà active.');
      return;
    }

    if (category && this.isDefaultCategory(category)) {
      return; // Ne pas éditer "Sans catégorie"
    }

    const autoFocusField: 'name' | 'description' | undefined = !category && !focusField ? 'name' : focusField;

    this.editingCategory = category ? { ...category } : { _id: null, name: '', description: '' };

    this.categoryForm = this.fb.group({
      name: [
        this.editingCategory.name,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"%°\-]+$/),
        ],
      ],
      description: [
        this.editingCategory.description,
        [
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"%°\-]+$/),
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

  //Cancel et ferme la fenetre
  cancelEditingCategory(event?: FocusEvent): void {
    const relatedTarget = event?.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('.editing-mode')) {
      return;
    }
    setTimeout(() => {
      this.editingCategory = null;
      // Supprimer la ligne temporaire si on était en création
      this.categories.data = this.categories.data.filter(cat => cat._id !== null);
    }, 0);
    // this.editingCategory = null;
    // this.categories.data = this.categories.data.filter(cat => cat._id !== null);
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

    // console.log('save -> newCategory', newCategory);  

    const request$ = category._id
      ? this.categoryService.updateCategory(category._id, newCategory)
      : this.categoryService.createCategory(newCategory);

    request$
      .pipe(
        tap(() => this.cancelEditingCategory()),
        catchError(() => {
          this.cancelEditingCategory();
          return of(null);
        })
      )
      .subscribe();
  }

  // Création depuis product-Form
  private createNewCategory(data: {name: string; description?: string}): void {
    const newCategory: Category = { 
      _id: null, 
      name: this.formatNameInput(data.name),
      description: data.description || '',
    };
    // console.log('📋 category-admin -> createNewCategory -> newCategory :', newCategory);

    this.categoryService
      .createCategory(newCategory)
      .subscribe((createdCategory) => {
        // Envoie l'objet complet avec l'ID généré
        this.sharedDataService.sendCategoryToProductForm(createdCategory);
      });
  }

  //Delete
  deleteCategory(category: Category): void {
    if (this.isDefaultCategory(category)) {
      return; // Ne pas supprimer "Sans catégorie"
    }

    if (category.productCount && category.productCount > 0) {
      // console.log('pouet : ', category.productCount);

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `Cette catégorie contient <span class="bold-text"> ${category.productCount} produit(s)</span>. <br>
          Êtes-vous sûr de vouloir supprimer la catégorie : <br>
          <span class="bold-text">"${category.name}" ?`,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result  === 'confirm') {
          // console.log('pouet supprimé : ', category.productCount);
          this.categoryService
            .deleteCategory(category._id!)
            .subscribe(() => {});
        }
      });
    } else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `Êtes-vous sûr de vouloir supprimer cette catégorie : <br> <span class="bold-text">"${category.name}"</span> ?`,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirm') {
          this.categoryService
            .deleteCategory(category._id!)
            .subscribe(() => {});
        }
      });
    }
  }

}
