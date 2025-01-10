import { Component, OnInit, ViewChild } from '@angular/core';

import { Product, ProductService } from '../../services/product.service';
import { Ingredient, IngredientService, } from '../../services/ingredient.service';
import { Category, CategoryService } from '../../services/category.service';
import { ImageService } from '../../services/image.service';

import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

import { forkJoin } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AdminModule } from './admin.module';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    AdminModule,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  products = new MatTableDataSource<Product>([]);
  ingredients = new MatTableDataSource<Ingredient>([]);
  categories = new MatTableDataSource<Category>([]);

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
    private categoryService: CategoryService,
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

  ///////////////////////////////////
  // Catégories
  ///////////////////////////////////

  fecthCategories(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories.data = categories;
    });
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
    const categories$ = this.categoryService.getCategories();
    const ingredients$ = this.ingredientService.getIngredients();

    forkJoin([categories$, ingredients$]).subscribe(
      ([categories, ingredients]) => {
        const imageUrls =
          product?.images?.map((imagePath) =>
            this.imageService.getImageUrl(imagePath)
          ) || [];

        const dialogRef = this.dialog.open(ProductFormComponent, {
          width: '600px',
          data: {
            product,
            imageUrls,
            categories: categories,
            ingredients: ingredients,
          },
        });

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
          if (result) {
            console.log('pouet :', result);
          }
        });
      }
    ),
      (error: any) => {
        console.error(
          'Erreur lors du chargement des catégories ou des ingrédients :',
          error
        );
      };
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

    dialogRef.afterClosed().subscribe(
      (
        result:
          | {
              ingredientData: any;
              selectedFiles: File[];
              removedExistingImages: string[];
            }
          | undefined
      ) => {
        if (result) {
          this.handleIngredientFormSubmit(result);
        }
      }
    );
  }

  handleIngredientFormSubmit(result: {
    ingredientData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
  }): void {
    const { ingredientData, selectedFiles } = result;
    const existingImages = ingredientData.existingImages ?? [];
    const ingredientId = ingredientData._id;

    // Vérifier et supprimer les images existantes marquées pour suppression
    if (result.removedExistingImages?.length) {
      console.log(
        'handleIngredientFormSubmit -> removedExistingImages : ',
        result.removedExistingImages
      );
      result.removedExistingImages.forEach((imgPath) => {
        const filename = imgPath.replace('/^/?uploads/?/', '');
        console.log('handleIngredientFormSubmit -> filename : ', filename);
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
          );

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
      images: finalImages,
    };

    console.log(
      'admin.component -> submitIngredientForm -> ingredientPayload : ',
      ingredientPayload
    );

    if (ingredientId) {
      console.log('id trouvé');
      this.updateIngredient(ingredientId, ingredientPayload);
    } else {
      console.log('id non trouvé');
      this.addIngredient(ingredientPayload);
    }
  }

  addIngredient(ingredientPayload: any): void {
    delete ingredientPayload._id;
    console.log(
      'admin.component -> addIngredient -> ingredientPayload : ',
      ingredientPayload
    );

    this.ingredientService.createIngredient(ingredientPayload).subscribe({
      next: (res) => {
        console.log('admin.component -> addIngredient -> res : ', res);
        this.fetchIngredients();
      },
      error: (error) => {
        console.error('admin.component -> addIngredient -> error : ', error);
      },
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
      },
    });
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
        console.log('admin.component : ', result);
        if (ingredient.images?.length) {
          for (const image of ingredient.images) {
            this.imageService.deleteImage(image).subscribe(() => {
              console.log('Image deleted successfully... ou pas');
            });
          }
        }

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
