import { Component, ElementRef, ViewChild } from '@angular/core';
import { IngredientAdminComponent } from './ingredient-admin/ingredient-admin.component';
import { ProductAdminComponent } from './product-admin/product-admin.component';
import { CategoryAdminComponent } from './category-admin/category-admin.component';
import { SupplierAdminComponent } from './supplier-admin/supplier-admin.component';
import autoAnimate from '@formkit/auto-animate';
import { ADMIN_SHARED_IMPORTS } from './admin-material';
import { MATERIAL_IMPORTS } from '../../app-material';
import { ADMIN_SHARED_PROVIDERS } from './admin.providers';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    MATERIAL_IMPORTS,
    ADMIN_SHARED_IMPORTS,
    CategoryAdminComponent,
    SupplierAdminComponent,
    IngredientAdminComponent,
    ProductAdminComponent
  ],
  providers: [ADMIN_SHARED_PROVIDERS],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  activePanel: string | null = null;

  panels = [
    { key: 'products', label: 'Produits', count: 0 },
    { key: 'ingredients', label: 'Ingrédients', count: 0 },
    { key: 'categories', label: 'Catégories', count: 0 },
    { key: 'suppliers', label: 'Fournisseurs', count: 0 },
  ];

  @ViewChild('bentoContainer', { static: true }) bentoContainer!: ElementRef;

  ngAfterViewInit(): void {
    if (this.bentoContainer?.nativeElement) {
      autoAnimate(this.bentoContainer.nativeElement);
    }
  }

  updatePanelCount(key: string, count: number): void {
    setTimeout(() => {
      const panel = this.panels.find((p) => p.key === key);
      if (panel) {
        panel.count = count;
      }
    });
  }

  togglePanel(panelKey: string) {
    this.activePanel = this.activePanel === panelKey ? null : panelKey;
  }

  isSolo(panelKey: string): boolean {
    return this.activePanel !== null && this.activePanel !== panelKey;
  }

  isActivePanel(panelKey: string): boolean {
    return this.activePanel === panelKey;
  }

  closePanel(event: Event) {
    event.stopPropagation();
    this.activePanel = null;
  }
}
