import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/product';
import { ProductService } from '../../../services/product.service';
import { ShopDetailComponent } from "../shop-detail/shop-detail.component";
import { ImageService } from '../../../services/image.service';
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
export class ShopGridComponent implements OnInit{
  products: Product[] = [];
  selectedProduct: Product | null = null;

  // Grille d'affichage
  cols: number = 5;
  grid1: Product[] = [];
  grid2: Product[] = [];

  constructor(
    private productService: ProductService,
    private imageService: ImageService,
  ){}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe((products) => {
      this.products = products.map((product) => ({
        ...product,
        images: product.images?.map((imagePath) => this.imageService.getImageUrl(imagePath))
      }));
      this.updateGrid();
      console.log('🚀 Produits finaux avec images mises à jour :', this.products);
    });
  }

  onSelectProduct(product: Product): void {
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
