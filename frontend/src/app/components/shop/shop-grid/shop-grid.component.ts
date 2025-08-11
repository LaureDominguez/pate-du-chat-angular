import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Product } from '../../../models/product';
import { ShopDetailComponent } from "../shop-detail/shop-detail.component";
import { MATERIAL_IMPORTS } from '../../../app-material';

@Component({
  selector: 'app-shop-grid',
  imports: [
    MATERIAL_IMPORTS, 
    ShopDetailComponent
  ],
  templateUrl: './shop-grid.component.html',
  styleUrls: ['./shop-grid.component.scss']
})
export class ShopGridComponent implements OnChanges{
  @Input() products: Product[] = [];
  @Input() selectedProduct?: Product | null = null;
  @Input() cols: number = 5;

  @Output() select = new EventEmitter<Product>();
  @Output() close = new EventEmitter<void>();

  grid1: Product[] = [];
  grid2: Product[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Changements détectés dans le composant ShopGrid:', changes);
    this.updateGrid();
    console.log('Grille mise à jour:', this.grid1, this.grid2);
  }

  onSelectProduct(product: Product): void {
    this.select.emit(product);
  }

    closeProduct(): void {
      this.close.emit();
  }

  private updateGrid(): void {
    if (this.selectedProduct) {
      const selectedIndex = this.products.indexOf(this.selectedProduct);
      this.grid1 = this.products.slice(0, selectedIndex);
      this.grid2 = this.products.slice(selectedIndex + 1);
    } else {
      this.grid1 = this.products;
      this.grid2 = [];
    }
  }

  trackById = (index: number, product: Product): string => product._id ?? product.slug ?? product.name;
}
