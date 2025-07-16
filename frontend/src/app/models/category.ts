export interface Category {
    _id?: string | null;
    name: string;
    description?: string;
    productCount?: number;
}

export const DEFAULT_CATEGORY: Category = {
    _id: '65a123456789abcd12345678',
    name: 'Sans catégorie',
};