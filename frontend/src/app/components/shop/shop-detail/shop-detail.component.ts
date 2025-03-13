import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FinalProduct } from '../../../models/product';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-shop-detail',
  imports: [AppModule],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss']
})
export class ShopDetailComponent {
  @Input() product!: FinalProduct;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
