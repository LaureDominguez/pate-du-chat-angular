export interface Supplier {
    _id?: string | null;
    name: string;
    description?: string;
    ingredientCount?: number;
}

export const DEFAULT_SUPPLIER: Supplier = {
    _id: '67d6a38cac36810d223b612e',
    name: 'Sans fournisseur',
};