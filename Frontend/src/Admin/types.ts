import { CATEGORIES } from '../data/categories';

export interface Product {
    id: string;
    images: (File | string)[];
    name: string;
    title: string;
    description: string;
    mrp: number;
    sellingPrice: number;
    discountPercentage: number;
    specification: string;
    stock: number | 'in stock';
    stockType: 'number' | 'dropdown';
    category: string;
    skuId: string;
    sellingPriceLink: string;
    product_video?: string; // Add product_video field
}

export type ProductFormData = Omit<Product, 'id'>;

// Use centralized categories from data/categories.ts
export const categories = CATEGORIES.map(cat => cat.name);