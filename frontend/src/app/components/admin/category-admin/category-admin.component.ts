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
  displayedCategoriesColumns: string[] = ['name', 'productCount', 'actions'];
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
  @ViewChild('categoryInput') categoryInput!: ElementRef;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit(): void {
    // Écoute les catégories mises à jour via le BehaviorSubject
    this.categoryService.getCategories()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categories) => {
        if (!categories.some((cat) => cat._id === DEFAULT_CATEGORY._id)) {
          categories.unshift(DEFAULT_CATEGORY);
        }
        this.categories.data = categories;
      });
    // Écoute les nouvelles catégories envoyées par product-form
    this.sharedDataService.requestNewCategory$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categoryName) => {
        this.createNewCategory(categoryName);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    this.categories.paginator = this.categoriesPaginator;
    this.categories.sort = this.categoriesSort;
  }

  focusInput(): void {
    setTimeout(() => {
      this.categoryInput?.nativeElement.focus();
    });
  }

  // Méthodes pour gérer les catégories
  startEditing(category: Category | null = null): void {
    if (category && this.isDefaultCategory(category)) {
      console.log('❌ Ne pas éditer "Sans catégorie"');
      return; // ❌ Ne pas éditer "Sans catégorie"
    }
    this.editingCategory = category ? { ...category } : { _id: null, name: '' };

    this.categoryForm = this.fb.group({
      name: [
        this.editingCategory.name,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/),
        ],
      ],
    });
    if (!this.editingCategory._id) {
      this.categories.data = [this.editingCategory, ...this.categories.data];
    }
    this.focusInput();
  }

  //Cancel et ferme la fenetre
  cancelEdit(event?: FocusEvent): void {
    const relatedTarget = event?.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.classList.contains('save')) {
      return;
    }
    this.editingCategory = null;
    this.categories.data = this.categories.data.filter(cat => cat._id !== null);
  }

  //Save
  saveCategory(category: Category): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const newCategory: Category = {
      name: this.categoryForm.get('name')?.value.trim(), // Nettoyage des espaces
    };

    const request$ = category._id
      ? this.categoryService.updateCategory(category._id, newCategory)
      : this.categoryService.createCategory(newCategory);

    request$
      .pipe(
        tap(() => this.cancelEdit()),
        catchError(() => {
          this.cancelEdit();
          return of(null);
        })
      )
      .subscribe();
    // if (category._id) {
    //   // Update
    //   this.categoryService
    //     .updateCategory(category._id, newCategory)
    //     .subscribe(() => {
    //       this.cancelEdit();
    //     });
    // } else {
    //   // Create
    //   this.categoryService.createCategory(newCategory).subscribe({
    //     next: () => {
    //       this.cancelEdit();
    //     },
    //     error: (error) => {
    //       this.cancelEdit();
    //     }
    //   });
    // }
  }

  // Création depuis product-Form
  private createNewCategory(categoryName: string): void {
    const newCategory: Category = { _id: null, name: categoryName };

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
      console.log('❌ Ne pas supprimer "Sans catégorie"');
      return; // ❌ Ne pas supprimer "Sans catégorie"
    }

    if (category.productCount && category.productCount > 0) {
      console.log('pouet : ', category.productCount);

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `Cette catégorie contient <span class="bold-text"> ${category.productCount} produit(s)</span>. <br>
          Êtes-vous sûr de vouloir supprimer la catégorie : <br>
          <span class="bold-text">"${category.name}" ?`,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {

          console.log('pouet supprimé : ', category.productCount);
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
          this.categoryService.deleteCategory(category._id!).subscribe(() => {});
        }
      });
    }
  }

}
