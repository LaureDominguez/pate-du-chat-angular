import { Component, OnInit } from '@angular/core';
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

  // Grille d'affichage
  cols: number = 5;
  grid1: FinalProduct[] = [];
  grid2: FinalProduct[] = [];

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
      this.updateGrid();
      console.log('🚀 Produits finaux avec images mises à jour :', this.products);
    });
  }

  onSelectProduct(product: FinalProduct): void {
    this.selectedProduct = product;
    console.log('🚀 Produit sélectionné :', this.selectedProduct);
    this.updateGrid();
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

  closeProduct(): void {
    this.selectedProduct = null;
    this.updateGrid();
  }
}
