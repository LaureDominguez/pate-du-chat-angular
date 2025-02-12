import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AdminModule } from '../admin.module';
import { MatTableDataSource } from '@angular/material/table';
import { Category, CategoryService } from '../../../services/category.service';
import { MatPaginator } from '@angular/material/paginator';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { SharedDataService } from '../../../services/shared-data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-category-admin',
  imports: [AdminModule],
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.scss', '../admin.component.scss'],
})
export class CategoryAdminComponent implements OnInit {
  categories = new MatTableDataSource<Category>([]);
  displayedCategoriesColumns: string[] = ['name', 'productCount', 'actions'];
  categoryForm!: FormGroup;
  newCategory: Category | null = null;
  editingCategoryId: string | null = null;
  editingCategory: Category | null = null;

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
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories.data = categories;
    });
    // Écoute les nouvelles catégories envoyées par product-form
    this.sharedDataService.requestNewCategory$.subscribe((categoryName) => {
      this.createNewCategory(categoryName);
    });
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
    this.editingCategory = category ? { ...category } : { _id: null, name: '' };
    
    this.categoryForm = this.fb.group({
      name: [
        this.editingCategory.name,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZÀ-ÿ0-9\s]+$/),
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

    if (category._id) {
      // Update
      this.categoryService.updateCategory(category._id, newCategory).subscribe(() => {
        this.cancelEdit();
      });
    } else {
      // Create
      this.categoryService.createCategory(newCategory).subscribe(() => {
        this.cancelEdit();
      });
    }
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `Êtes-vous sûr de vouloir supprimer cette catégorie : <br> <span class="bold-text">"${category.name}"</span> ?`,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.categoryService.deleteCategory(category._id!).subscribe(() => {
        });
      }
    });
  }
}
