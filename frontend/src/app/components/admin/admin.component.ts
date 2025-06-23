import { Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { AdminModule } from './admin.module';
import { IngredientAdminComponent } from './ingredient-admin/ingredient-admin.component';
import { ProductAdminComponent } from './product-admin/product-admin.component';
import { CategoryAdminComponent } from './category-admin/category-admin.component';
import { SupplierAdminComponent } from './supplier-admin/supplier-admin.component';
import { CategoryService } from '../../services/category.service';
import { SupplierService } from '../../services/supplier.service';
import { IngredientService } from '../../services/ingredient.service';
import { ProductService } from '../../services/product.service';
import autoAnimate from '@formkit/auto-animate';

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

  @ViewChild('productTemplate', { static: true }) productTemplate!: TemplateRef<any>;
  @ViewChild('ingredientTemplate', { static: true }) ingredientTemplate!: TemplateRef<any>;
  @ViewChild('categoryTemplate', { static: true }) categoryTemplate!: TemplateRef<any>;
  @ViewChild('supplierTemplate', { static: true }) supplierTemplate!: TemplateRef<any>;

  @ViewChild('bentoContainer', { static: true }) bentoContainer!: ElementRef;


  constructor(
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private ingredientService: IngredientService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCounts();
  }

  ngAfterViewInit(): void {
    if (this.bentoContainer?.nativeElement) {
      autoAnimate(this.bentoContainer.nativeElement);
    }
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

  togglePanel(panelKey: string) {
    const target = this.panels.find(p => p.key === panelKey);
    if (target) {
      this.activePanel = panelKey;
    }
  }
  
  isSolo(panelKey: string): boolean {
    return this.activePanel !== null && this.activePanel !== panelKey;
  }
  

  closePanel(event: Event) {
    event.stopPropagation();
    this.activePanel = null;
  }

  getTemplate(panelKey: string): TemplateRef<any> | null {
    switch (panelKey) {
      case 'products':
        return this.productTemplate;
      case 'ingredients':
        return this.ingredientTemplate;
      case 'categories':
        return this.categoryTemplate;
      case 'suppliers':
        return this.supplierTemplate;
      default:
        return null;
    }
  }
  
}
