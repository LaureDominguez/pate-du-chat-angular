import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Product } from '../../../services/product.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  imports: [CommonModule, MatCardModule],
})
export class ProductCardComponent implements OnChanges {
  @Input() product!: Product;
  @Input() isSelected!: boolean;
  @Output() closeClick: EventEmitter<void> = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ingredients']) {
    }
  }

  onCloseClick(event: Event) {
    event.stopPropagation();
    this.closeClick.emit();
  }
}
