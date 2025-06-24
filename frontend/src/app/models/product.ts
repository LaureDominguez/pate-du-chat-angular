import { Category } from "./category";
import { Ingredient } from "./ingredient";

export interface Product {
    _id?: string;
    name: string;
    category: string | Category;
    description?: string;
    composition?: (string | Ingredient)[];
    dlc: string;
    cookInstructions?: string;
    stock: boolean;
    stockQuantity?: number;
    quantityType: string;
    price: number;
    images?: string[];
}

export interface FinalProduct extends Product {
    allergens: string[];
    vegan: boolean;
    vegeta: boolean;
}
