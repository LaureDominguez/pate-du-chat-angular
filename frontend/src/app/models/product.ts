import { Category } from "./category";
import { Ingredient } from "./ingredient";

export interface Product {
    _id?: string;
    slug: string;
    name: string;
    category: string | Category;
    description?: string;
    composition?: (string | Ingredient)[];
    dlc: string;
    cookInstructions?: string;
    forSale: boolean;
    stockQuantity?: number;
    isAvailable?: boolean;
    quantityType: string;
    price: number;
    images?: string[];
    createdAt?: string;
    updatedAt?: string;

    // Additional fields
    allergens?: string[];
    vegan?: boolean;
    vegeta?: boolean;
}
