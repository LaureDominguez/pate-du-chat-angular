export type AdminEntityType = 'product' | 'ingredient' | 'supplier' | 'category';

export interface AdminEntity {
    _id: string;
    name: string;
    [key: string]: any;
}
