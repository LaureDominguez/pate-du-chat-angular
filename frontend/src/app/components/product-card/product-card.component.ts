import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output} from '@angular/core';
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
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() isSelected!: boolean;
  @Output() closeClick: EventEmitter<void> = new EventEmitter<void>();

  onCloseClick(event: Event) {
    event.stopPropagation();
    this.closeClick.emit();
  }

  constructor(private productsComponent: ProductsComponent) {}
}


