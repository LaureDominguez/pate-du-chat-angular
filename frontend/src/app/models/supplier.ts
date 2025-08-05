export interface Supplier {
    _id?: string | null;
    slug?: string;
    name: string;
    description?: string;
    ingredientCount?: number;
    ingredients?: { _id: string, name?: string }[];
    createdAt?: string;
    updatedAt?: string;
}

export const DEFAULT_SUPPLIER: Supplier = {
    _id: '67d6a38cac36810d223b612e',
    // slug: 'sans-fournisseur',
    name: 'Sans fournisseur',
};