export interface Category {
    _id?: string | null;
    slug?: string;
    name: string;
    description?: string;
    productCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export const DEFAULT_CATEGORY: Category = {
    _id: '65a123456789abcd12345678',
    // slug: 'sans-categorie',
    name: 'Sans catégorie',
};