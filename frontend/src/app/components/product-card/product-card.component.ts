import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Product } from '../../services/product.service';
import { ProductsComponent } from '../products/products.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, ProductsComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.sass',
})
export class ProductCardComponent{
  @Input() product!: Product;
  // @Output() selectProductEvent = new EventEmitter();
  // @Output() deselectProductEvent = new EventEmitter();
  // @Output() isSelectedEvent = new EventEmitter();

  constructor(private productsComponent: ProductsComponent) {}

  // selectProduct(product: Product) {
  //   this.selectProductEvent.emit(this.product);
  // }

  // deselectProduct(event: Event) {
  //   this.deselectProductEvent.emit();
  // }

  // isSelected(): boolean {
  //   return this.isSelectedEvent.emit(this.product);
  // }
}


