import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminModule } from '../admin.module';
import { MatTableDataSource } from '@angular/material/table';
import { Category, CategoryService } from '../../../services/category.service';
import { MatPaginator } from '@angular/material/paginator';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-category-admin',
  imports: [AdminModule],
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.scss', '../admin.component.scss'],
})
export class CategoryAdminComponent implements OnInit {
  categories = new MatTableDataSource<Category>([]);
  displayedCategoriesColumns: string[] = ['name', 'actions'];
  editingCategoryId: string | null = null;

  @ViewChild('categoriesPaginator') categoriesPaginator!: MatPaginator;

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fecthCategories();
  }

  ngAfterViewInit(): void {
    this.categories.paginator = this.categoriesPaginator;
  }

  fecthCategories(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories.data = categories;
    });
  }

  // Méthodes pour gérer les catégories
  //Add
  addCategory(): void {
    console.log('Ajouter une nouvelle catégorie');
    const newCategory: Category = { _id: null, name: '' };
    this.categories.data = [newCategory, ...this.categories.data];
  }

  // Edit
  editCategory(categoryId: string | null): void {
    this.editingCategoryId = categoryId;
  }

  cancelEdit(): void {
    this.editingCategoryId = null;
    this.fecthCategories();
  }

  //Save
  saveCategory(category: Category): void {
    if (category._id) {
      // Logique pour mettre à jour la catégorie existante
      this.categoryService.updateCategory(category).subscribe(() => {
        console.log('Catégorie mise à jour avec succès');
        this.fecthCategories();
        this.cancelEdit();
      });
    } else {
      // Logique pour créer une nouvelle catégorie
      this.categoryService.createCategory(category).subscribe((created) => {
        console.log('Catégorie crée avec succès');
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
