import { CommonModule } from '@angular/common';
import { Component, Input} from '@angular/core';
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
  @Input() isSelected!: boolean;

  constructor(private productsComponent: ProductsComponent) {}

}


