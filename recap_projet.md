# Recap Projet – Pâtes du Chat

## Présentation rapide

> site web pour un restaurateur artisan de pâtes, doit avoir une page vitrine, prise de commande en ligne, actus du site, et formulaire de contact coté visiteurs, et coté admin une page pour gérer les stocks, gérer les produits, gérer les newsletters, et publier des billets de nouvelles sous forme d'article de blog

## Stack technique

-   **Front** : Angular 19, TypeScript, Angular Material, SCSS
-   **Back / API** : (ex: NestJS, Express…)
-   **DB** : MongoDB, morgan, helmet
-   **Middleware** : Multer
-   **Autres** : …

## Base de données

| Collection | Description                                                                                            | Champs clés                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| product    | produit complet composé d'ingrédients et classé par catégories, affiché en boutique pour les visiteurs | \_id?: string; name: string; category: string | Category; description?: string; composition: (string | Ingredient)[]; dlc: string; cookInstructions?: string; stock: boolean; stockQuantity?: number; quantityType: string; price: number; images?: string[]; |

| ingredient | ingredient qui compose les produits, est associé à 1 fournisseur | \_id?: string; name: string; bio: boolean; supplier: string | Supplier; type: 'simple' | 'compose'; subIngredients?: (string | Ingredient)[]; allergens: string[]; vegan: boolean; vegeta: boolean; origin: string; images?: string[]; |
| category | categorie utilisée pour regrouper les produits | \_id?: string; name: string; description?: string; productCount?: number; |
| supplier | fournisseur de l'ingredient, utilisé pour les ingredients dans un but de tracabilité et gestion des stock | \_id?: string; name: string; description?: string; ingredientCount?: number; ingredients?: {\*id: string, name?: string}[]; |

## Modules / composants terminés

-   Category-admin.component + category.service
-   Supplier-admin.component + supplier.service
-   Ingredient-admin.component + Ingredient-form.component + ingredient.service
-   Product-admin.component + Product-form.component + product.service
-   Image-carousel.component (composant dumb)
-   Admin.component (dumb hub qui affiche les composent admin de product, ingredient, category et supplier)
-   modules : app-material (general), admin-material et admin.providers (partie admin)
-   dialog.service (utilise MatDialog), avec confirm-dialog.component, info-dialog.component, quick-create-dialog.component
-   shared-data.service (gère les abonnements entre product, ingredient, supplier et category, gère aussi la création rapide d'objets entre les 4 modules via quick-create-dialog.component
-   theme.service (basé sur un theme perso de material, créé à l'origine avec le module de theme Agnular Material, puis le theme builder de Material sur Figma, très instable on l'a simplifié et déconnecté au maximum pour qu'il fonctionne. gère le mode jour/nuit)
-   nav.component (layout de l'app)

## Fonctionnalités en cours

-   Afficher les produits créé coté admin sur la page de la boutique coté visiteurs

## Tests

-   **Framework** : Jasmin
-   Couverture actuelle : 60 %

## CI / CD

-   Pipeline : GitHub (https://github.com/LaureDominguez/pate-du-chat-angular)

## Design

-   A décider

## Prochaines étapes

1. Mettre à jour les tests
2. Créer un visuel de la boutique sur figma
3. Connecter la boutique à la gestion de stock coté admin

## Notes diverses

-   …
