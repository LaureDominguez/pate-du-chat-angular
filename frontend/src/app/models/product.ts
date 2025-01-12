export interface Product {
    _id?: string;
    name: string;
    category: string;
    description?: string;
    composition?: string[];
    price: number;
    stock: boolean;
    images?: string[];
}

export interface FinalProduct extends Product {
    allergens: string[];
    vegan: boolean;
    vegeta: boolean;
}
