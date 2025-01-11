import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminModule } from '../admin.module';
import { MatTableDataSource } from '@angular/material/table';
import { Category, CategoryService } from '../../../services/category.service';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-category-admin',
  imports: [AdminModule],
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.scss', '../admin.component.scss'],
})
export class CategoryAdminComponent implements OnInit {
  categories = new MatTableDataSource<Category>([]);

  displayedCategoriesColumns: string[] = ['name', 'actions'];

  @ViewChild('categoriesPaginator') categoriesPaginator!: MatPaginator;

  constructor(private categoryService: CategoryService) {}

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
  openCategoryForm(category: { id: string; name: string } | null): void {
    if (category) {
      // Logique pour ouvrir un formulaire de modification
      console.log('Modifier catégorie:', category);
    } else {
      // Logique pour ouvrir un formulaire de création
      console.log('Créer une nouvelle catégorie');
    }
  }

  deleteCategory(category: { id: string; name: string }): void {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`
      )
    ) {
      // Logique pour supprimer la catégorie
      console.log('Supprimer catégorie:', category);
    }
  }
}
