export interface Ingredient {
    _id?: string;
    name: string;
    bio: boolean;
    supplier: string;
    type: 'simple' | 'compose';
    subIngredients?: Ingredient[];
    allergens: string[];
    vegan: boolean;
    vegeta: boolean;
    images?: string[];
}

