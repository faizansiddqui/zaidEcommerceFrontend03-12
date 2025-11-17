import { CATEGORIES } from '../data/categories';

export interface Product {
    id: string;
    images: (File | string)[];
    title: string;
    description: string;
    mrp: number;
    sellingPrice: number;
    discountPercentage: number;
    material: string;
    dimensions: string;
    stock: number | 'in stock' | 'out of stock';
    stockType: 'number' | 'dropdown';
    category: string;
    features: string[];
    skuId: string;
}

export type ProductFormData = Omit<Product, 'id'>;

// Use centralized categories from data/categories.ts
export const categories = CATEGORIES.map(cat => cat.name);

