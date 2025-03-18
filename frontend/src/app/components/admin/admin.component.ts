import { Component, OnInit} from '@angular/core';
import { AdminModule } from './admin.module';
import { IngredientAdminComponent } from './ingredient-admin/ingredient-admin.component';
import { ProductAdminComponent } from './product-admin/product-admin.component';
import { CategoryAdminComponent } from './category-admin/category-admin.component';
import { SupplierAdminComponent } from './supplier-admin/supplier-admin.component';
import { CategoryService } from '../../services/category.service';
import { SupplierService } from '../../services/supplier.service';
import { IngredientService } from '../../services/ingredient.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    AdminModule,
    CategoryAdminComponent,
    SupplierAdminComponent,
    IngredientAdminComponent,
    ProductAdminComponent
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  activePanel: string | null = null;
  
  // Liste des panels avec leur clé et leur titre
  panels = [
    { key: 'products', label: 'Produits', count: 0 },
    { key: 'ingredients', label: 'Ingrédients', count: 0 },
    { key: 'categories', label: 'Catégories', count: 0 },
    { key: 'suppliers', label: 'Fournisseurs', count: 0 },
  ];

  constructor(
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private ingredientService: IngredientService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCounts();
  }

  loadCounts(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.updatePanelCount('categories', categories.length);
    });

    this.supplierService.getSuppliers().subscribe((suppliers) => {
      this.updatePanelCount('suppliers', suppliers.length);
    });

    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.updatePanelCount('ingredients', ingredients.length);
    });

    this.productService.getProducts().subscribe((products) => {
      this.updatePanelCount('products', products.length);
    });
  }

  updatePanelCount(key: string, count: number): void {
    const panel = this.panels.find((p) => p.key === key);
    if (panel) {
      panel.count = count;
    }
  }

  togglePanel(panel: string) {
    this.activePanel = this.activePanel === panel ? null : panel;
  }

  closePanel(event: Event) {
    event.stopPropagation(); // Empêche le clic de fermer immédiatement après l'ouverture
    this.activePanel = null;
  }
}
