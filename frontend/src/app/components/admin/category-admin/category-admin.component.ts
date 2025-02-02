import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AdminModule } from '../admin.module';
import { MatTableDataSource } from '@angular/material/table';
import { Category, CategoryService } from '../../../services/category.service';
import { MatPaginator } from '@angular/material/paginator';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-category-admin',
  imports: [AdminModule],
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.scss', '../admin.component.scss'],
})
export class CategoryAdminComponent implements OnInit {
  categories = new MatTableDataSource<Category>([]);
  displayedCategoriesColumns: string[] = ['name', 'actions'];
  newCategory: Category | null = null;
  editingCategoryId: string | null = null;
  editingCategory: Category | null = null;

  @ViewChild('categoriesPaginator') categoriesPaginator!: MatPaginator;
  @ViewChild('categoriesSort') categoriesSort!: MatSort;
  @ViewChild('categoryInput') categoryInput!: ElementRef;

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fecthCategories();
  }

  ngAfterViewInit(): void {
    this.categories.paginator = this.categoriesPaginator;
    this.categories.sort = this.categoriesSort;
  }

  fecthCategories(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories.data = categories;
    });
  }

  focusInput(): void {
    setTimeout(() => {
      this.categoryInput?.nativeElement.focus();
    });
  }

  // Méthodes pour gérer les catégories

  startEditing(category: Category | null = null): void {
    this.editingCategory = category ? { ...category } : { _id: null, name: '' };
    console.log('editingCategory : ', this.editingCategory);
    if (!this.editingCategory._id) {
      console.log('new');
      this.categories.data = [this.editingCategory, ...this.categories.data];
    }
    this.focusInput();

  }

  cancelEdit(event?: FocusEvent): void {
    const relatedTarget = event?.relatedTarget as HTMLElement;
    if (
      relatedTarget &&
      relatedTarget.classList.contains('save')
    ) { return; }

    this.editingCategory = null;
    this.fecthCategories();
  }

  //Save
  saveCategory(category: Category): void {
    console.log('category pouet 3 : ', category);
    if (category._id) {
      // Logique pour mettre à jour la catégorie existante
      this.categoryService.updateCategory(category).subscribe(() => {
        this.fecthCategories();
        this.cancelEdit();
      });
    } else {
      // Logique pour créer une nouvelle catégorie
      this.categoryService.createCategory(category).subscribe((created) => {
        this.fecthCategories();
        this.cancelEdit();
      });
    }
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
          console.log('Catégorie supprimée avec succès');
          this.fecthCategories();
        });
      }
    });
  }
}
