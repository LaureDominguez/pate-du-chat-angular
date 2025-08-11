
import { Component, OnInit } from '@angular/core';
import { MATERIAL_IMPORTS } from '../../app-material';
import { ShopGridComponent } from "./shop-grid/shop-grid.component";
import { Product } from '../../models/product';
import { ImageService } from '../../services/image.service';
import { ProductService } from '../../services/product.service';

@Component({
    selector: 'app-shop',
    imports: [
        MATERIAL_IMPORTS,
        ShopGridComponent
    ],
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
    products: Product[] = [];
    selectedProduct?: Product | null = null;
    cols: number = 5;

    constructor(
        private productService: ProductService,
        private imageService: ImageService
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
            console.log('🚀 Produits finaux avec images mises à jour :', this.products);
        });
    }

    onSelect(product: Product): void {
        this.selectedProduct = this.products.find(p => p._id === product._id) || null;
    }

    onClose(): void {
        this.selectedProduct = null;
    }
}
