import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { Product, ProductService } from '../../services/product.service';
import { Ingredient, IngredientService } from '../../services/ingredient.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  products = new MatTableDataSource<Product>([]);
  ingredients: Ingredient[] = [];
  displayedColumns: string[] = [
    'name',
    'category',
    'price',
    'stock',
    'actions',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService
  ) {}

  ngOnInit(): void {
    this.fecthProducts();
  }

  ngAfterViewInit() {
    this.products.paginator = this.paginator;
    this.products.sort = this.sort;
  }

  fecthProducts(): void {
    this.productService.getProducts().subscribe((products) => {
      this.products = new MatTableDataSource<Product>(products);
    });
  }

  fetchIngredients(): void {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients = ingredients;
    });
  }

  addProduct(): void {
    // Logique pour ajouter un ProductService
    console.log('Ajout du-produit :');
  }

  editProduct(product: Product): void {
    // Logique pour modifier un produit
    console.log('Modification du produit :', product);
  }

  deleteProduct(product: Product): void {
    // Logique pour supprimer un produit
    console.log('Suppression du produit :', product);
  }
}
