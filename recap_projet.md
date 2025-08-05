# Recap Projet – Pâtes du Chat

## Présentation rapide

> Site vitrine + prise de commande en ligne pour un artisan pastier.  
> Côté visiteurs : page d’accueil, catalogue produits (« vitrine »), actus, formulaire de contact.  
> Côté admin : gestion produits & stocks, newsletter, billets de blog.

## Stack technique

| Couche                    | Choix                                                          | Notes                          |
| ------------------------- | -------------------------------------------------------------- | ------------------------------ |
| **Front**                 | Angular 19.2 (CLI 19.2) • TypeScript • Angular Material • SCSS | Projet déjà migré              |
| **Back / API**            | Node.js 20 • Express 4                                         | REST ; héberge la SPA & l’API  |
| **DB**                    | MongoDB Atlas                                                  |                                |
| **Middleware / sécurité** | helmet • morgan • multer                                       | Headers, logs, upload d’images |

## Base de données

| Collection | Description                                                                                            | Champs clés                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| product    | produit complet composé d'ingrédients et classé par catégories, affiché en boutique pour les visiteurs | \_id?: string; name: string; category: string | Category; description?: string; composition: (string | Ingredient)[]; dlc: string; cookInstructions?: string; stock: boolean; stockQuantity?: number; quantityType: string; price: number; images?: string[]; |

| ingredient | ingredient qui compose les produits, est associé à 1 fournisseur | \_id?: string; name: string; bio: boolean; supplier: string | Supplier; type: 'simple' | 'compose'; subIngredients?: (string | Ingredient)[]; allergens: string[]; vegan: boolean; vegeta: boolean; origin: string; images?: string[]; |
| category | categorie utilisée pour regrouper les produits | \_id?: string; name: string; description?: string; productCount?: number; |
| supplier | fournisseur de l'ingredient, utilisé pour les ingredients dans un but de tracabilité et gestion des stock | \_id?: string; name: string; description?: string; ingredientCount?: number; ingredients?: {\*id: string, name?: string}[]; |

## Modules / composants terminés

-   **Admin** : Category-admin, Supplier-admin, Ingredient-admin, Product-admin, (+ forms & services)
-   **UI génériques** : Image-carousel (dumb) ; nav.component ; dialog.service (confirm/info/quick-create)
-   **Theming & providers** : app-material, admin-material, admin.providers, theme.service
-   **Shared** : shared-data.service
-   **Nouveau** : barre de navigation responsive + page d’accueil adaptée aux maquettes Figma

## Fonctionnalités en cours

-   **Page vitrine / catalogue produits** : affichage grid + filtres + routing `/shop`

## Tests

| Point          | État                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Framework**  | Jasmine + Karma                                                                                   |
| **Couverture** | Toutes les fonctionnalités existantes sont testées.<br/>Seuil à mesurer (objectif ≥ 80 % lignes). |

## CI / CD

-   Pipeline : GitHub (https://github.com/LaureDominguez/pate-du-chat-angular)

## Design

Maquettes Figma N/B exportées :  
`Pates-du-chat-desktop.png`, `Pates-du-chat-vitrine-mobile.png`, `Pates-du-chat-home-mobile.png` (voir dossier `design/`).

## Roadmap

| Phase | Tâches clés                             | Durée estimée |
| ----- | --------------------------------------- | ------------- |
| 1     | Vitrine + service Stock                 | ≈ 2 sem       |
| 2     | Authentification & gestion utilisateurs | ≈ 1 sem       |
| 3     | Click & Collect (panier / commandes)    | ≈ 1 sem       |
| 4     | Blog / Actus (admin + visiteur)         | ≈ 1 sem       |
| 5     | À propos : emplacements food-truck      | ≈ 4 j         |
| 6     | Formulaire Contact (email)              | ≈ 3 j         |
| 7     | Newsletter (opt-in + envoi)             | ≈ 1 sem       |
| 8     | Design tokens + Storybook               | ≈ 1 sem       |
| 9     | CI/CD & déploiement prod                | ≈ 3 j         |

_Les phases 1 → 3 posent les fondations (catalogue, auth, commande).  
Les phases 4 → 7 complètent le contenu et la communication._

## Prochaines étapes

### Phase 1 – Vitrine & Stock : tâches détaillées

1. **Modèle `product`**

    - Définir le schéma Mongoose (`stockQty`, `isAvailable`, `tags[]`, etc.)
    - Créer l’interface TypeScript côté front.

2. **Endpoint GET `/products`**

    - Pagination (`page`, `limit`) et filtres `category`, `tags`.
    - Réponse JSON alignée sur le modèle.

3. **Endpoint PATCH `/products/:id/stock`**

    - Mise à jour de la quantité, protégé par rôle **admin**.

4. **Seed de données**

    - Script `npm run seed:dev` qui injecte ~10 produits démo.

5. **Service Angular `product.service.ts`**

    - Méthodes : `getAll()`, `getById()`, `updateStock()`.

6. **Module & route `/shop`**

    - Lazy-loaded `ShopModule` + resolver pour pré-charger la liste.

7. **Composants UI**

    - `product-grid` (container)
    - `product-card` (dumb)
    - `filter-bar` (chips + select).

8. **Gestion des quantités**

    - Badge “Stock épuisé” ou désactivation du bouton « Ajouter ».

9. **Tests**

    - Unitaires (services, pipes) & E2E (Cypress scénario “voir catalogue”).
    - Lancer la couverture (`npm run test -- --code-coverage`) et noter le taux.

10. **Revue & merge**
    - Pull request validée, fusionné dans `main` + tag Git `v0.1.0`.

## Notes diverses

-   …
