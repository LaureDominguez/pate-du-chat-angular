import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Product } from '../../services/product.service';
import { ProductsComponent } from '../products/products.component';
import { Ingredient } from '../../services/ingredient.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, ProductsComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.sass',
})

export class ProductCardComponent implements OnChanges {
  @Input() product!: Product;
  @Input() ingredients!: Ingredient[];
  @Input() isSelected!: boolean;
  @Output() closeClick: EventEmitter<void> = new EventEmitter<void>();

  constructor(private productsComponent: ProductsComponent) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ingredients']) {
      console.log('pouet !!!', this.ingredients);
    }
  }

  onCloseClick(event: Event) {
    event.stopPropagation();
    this.closeClick.emit();
  }
}


