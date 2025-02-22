export interface Ingredient {
    _id?: string;
    name: string;
    supplier: string;
    allergens: string[];
    vegan: boolean;
    vegeta: boolean;
    images?: string[];
}

