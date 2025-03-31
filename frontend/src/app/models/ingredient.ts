import { Supplier } from "./supplier";

export interface Ingredient {
    _id?: string;
    name: string;
    bio: boolean;
    supplier: string | Supplier;
    type: 'simple' | 'compose';
    subIngredients?: (string | Ingredient)[];
    allergens: string[];
    vegan: boolean;
    vegeta: boolean;
    origin: string;
    images?: string[];
}

