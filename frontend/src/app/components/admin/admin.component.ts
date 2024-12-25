import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { Product, ProductService } from '../../services/product.service';
import {
  Ingredient,
  IngredientService,
} from '../../services/ingredient.service';
import { MatDialog } from '@angular/material/dialog';
import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { MatChipsModule } from '@angular/material/chips';
import { error } from 'console';
import { catchError, tap, throwError } from 'rxjs';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  products = new MatTableDataSource<Product>([]);
  ingredients = new MatTableDataSource<Ingredient>([]);

  displayedProductsColumns: string[] = [
    'name',
    'category',
    'price',
    'stock',
    'actions',
  ];
  displayedIngredientsColumns: string[] = [
    'name',
    'supplier',
    'allergens',
    'vegan',
    'vegeta',
    'actions',
  ];

  @ViewChild('productsPaginator') productsPaginator!: MatPaginator;
  @ViewChild('productsSort') productsSort!: MatSort;

  @ViewChild('ingredientsPaginator') ingredientsPaginator!: MatPaginator;
  @ViewChild('ingredientsSort') ingredientsSort!: MatSort;

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private imageService: ImageService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fecthProducts();
    this.fetchIngredients();
  }

  ngAfterViewInit() {
    this.products.paginator = this.productsPaginator;
    this.products.sort = this.productsSort;

    this.ingredients.paginator = this.ingredientsPaginator;
    this.ingredients.sort = this.ingredientsSort;

    this.products.data = this.products.data; // Pour actualiser les données
    this.ingredients.data = this.ingredients.data; // Idem pour les ingrédients
  }

  ////////////////////////////////////
  // Produits
  ////////////////////////////////////

  fecthProducts(): void {
    this.productService.getProducts().subscribe((products) => {
      this.products.data = products;
    });
  }

  openProductForm(product: Product | null): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '400px',
      data: { product },
    });

    dialogRef.afterClosed().subscribe((result: Product | null) => {
      if (result) {
        if (product) {
          this.updateProduct(product.id!, result);
        } else {
          this.addProduct(result);
        }
      }
    });
  }

  addProduct(product: Product): void {
    // Logique pour ajouter un ProductService
    console.log('Ajout du-produit :');
  }

  updateProduct(id: string, product: Product): void {
    // Logique pour modifier un produit
    console.log('Modification du produit :', product);
  }

  deleteProduct(product: Product): void {
    // Logique pour supprimer un produit
    console.log('Suppression du produit :', product);
  }

  //////////////////////////////////////
  // Ingrédients
  ////////////////////////////////////

  fetchIngredients(): void {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients.data = ingredients;
    });
  }

  openIngredientForm(ingredient: Ingredient | null): void {
      const imageUrls =
        ingredient?.images?.map((imagePath) =>
          this.imageService.getImageUrl(imagePath)
        ) || [];
    const dialogRef = this.dialog.open(IngredientFormComponent, {
      width: '400px',
      data: { ingredient, imageUrls },
    });

    dialogRef.afterClosed().subscribe((result: {
      ingredientData: any,
      selectedFiles: File[],
      removedExistingImages: string[]
    } | undefined) => {
      if (result) {
        // console.log('admin.component -> result : ', result);
        this.handleFormSubmit(result);
    } else {
      // console.log('admin.component -> form cancelled');
      }
    });
  }

  handleFormSubmit(result: {
    ingredientData: any,
    selectedFiles: File[],
    removedExistingImages: string[]
  }): void {
    const { ingredientData, selectedFiles } = result;
    const existingImages = ingredientData.existingImages ?? [];
    const ingredientId = ingredientData._id;

    // console.log('handleFormSubmit -> enter : ', result);

    // Vérifier et supprimer les images existantes marquées pour suppression
    if (result.removedExistingImages?.length) {
      result.removedExistingImages.forEach((imgPath) => {
        const filename = imgPath.replace('/^/?uploads/?/', '');
        this.imageService.deleteImage(filename).subscribe(() => {
          console.log('Image deleted successfully... ou pas');
        });
      });
    }

    // Fusionner les anciennes et nouvelles images
    const finalImages = [...existingImages];
    delete ingredientData.existingImages;

    if (selectedFiles.length > 0) {
      // 1. Uploader les fichiers
      this.imageService.uploadImages(selectedFiles).subscribe({
        next: (uploadResponse) => {
          const newFilePaths = uploadResponse.imagePath;

          // 2. Concaténer avec les images existantes
          finalImages.push(...newFilePaths); // Ajouter les nouvelles images
          console.log(
            'admin.component -> image uploadée, concatenation de finalImages -> finalImages : ',
            finalImages
          )

          // 3. Soumettre le formulaire
          console.log(
            'admin.component -> soumission du formulaire ',
            'id: ',
            ingredientId,
            'images: ',
            finalImages,
            'data: ',
            ingredientData
          );
          this.submitIngredientForm(ingredientId, ingredientData, finalImages);
        },
        error: (error) => {
          console.error(
            'admin.component -> echec de submitIngredientForm : ',
            error
          );
        },
      });
    } else {
      this.submitIngredientForm(ingredientId, ingredientData, finalImages);
    }
  }

  submitIngredientForm(
    ingredientId: string | undefined,
    ingredientData: any,
    finalImages: string[]
  ): void {
    const ingredientPayload = {
      ...ingredientData,
      images: finalImages
    };

    console.log('admin.component -> submitIngredientForm -> ingredientPayload : ', ingredientPayload);

    if (ingredientId) {
      console.log('id trouvé')
      this.updateIngredient(ingredientId, ingredientPayload);
    } else {
      console.log('id non trouvé')
      this.addIngredient(ingredientPayload);
    }
  }

  addIngredient(ingredientPayload: any): void {
    delete ingredientPayload._id;
    console.log('admin.component -> addIngredient -> ingredientPayload : ', ingredientPayload);

    this.ingredientService.createIngredient(ingredientPayload).subscribe({
      next: (res) => {
        console.log('admin.component -> addIngredient -> res : ', res);
        this.fetchIngredients();
      },
      error: (error) => {
        console.error('admin.component -> addIngredient -> error : ', error);
      }
    });
  }

  updateIngredient(id: string, ingredientPayload: any): void {
    this.ingredientService.updateIngredient(id, ingredientPayload).subscribe({
      next: (res) => {
        console.log('admin.component -> updateIngredient -> res : ', res);
        this.fetchIngredients();
      },
      error: (error) => {
        console.error('admin.component -> updateIngredient -> error : ', error);
      }
    })
  }

  deleteIngredient(ingredient: Ingredient): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `Êtes-vous sûr de vouloir supprimer cet ingrédient : "${ingredient.name}" ?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('admin.component : ', ingredient._id!);
        this.ingredientService
          .deleteIngredient(ingredient._id!)
          .subscribe(() => {
            this.fetchIngredients();
            console.log('admin.component : ', result);
          });
        console.log("Suppression de l'ingrédient : ", ingredient);
      }
    });
  }
}
