import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FinalProduct } from '../../../models/product';
import { ProductService } from '../../../services/product.service';
import { ShopDetailComponent } from "../shop-detail/shop-detail.component";
import { AppModule } from '../../../app.module';
import { ImageService } from '../../../services/image.service';

@Component({
  selector: 'app-shop-grid',
  imports: [
    AppModule, 
    ShopDetailComponent
  ],
  templateUrl: './shop-grid.component.html',
  styleUrls: ['./shop-grid.component.scss']
})
export class ShopGridComponent implements OnInit{
  products: FinalProduct[] = [];
  selectedProduct: FinalProduct | null = null;

  constructor(
    private productService: ProductService,
    private imageService: ImageService,
  ){}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getFinalProducts().subscribe((products) => {
      this.products = products.map((product) => ({
        ...product,
        images: product.images?.map((imagePath) => this.imageService.getImageUrl(imagePath))
      }));
      console.log('🚀 Produits finaux avec images mises à jour :', this.products);
    });
  }

  onSelectProduct(product: FinalProduct): void {
    this.selectedProduct = product;
  }

  closeProduct(): void {
    this.selectedProduct = null;
  }
}
