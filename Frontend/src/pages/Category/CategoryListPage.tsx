import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, SortAsc } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ProductCard from '../../components/Product/ProductCard';
import { productAPI } from '../../services/api';
import { productCache } from '../../services/productCache';
import { getCategories, Category } from '../../data/categories';
import { useNavigation } from "../../utils/navigation";
// 
import SkeletonLoader from '../../components/UI/SkeletonLoader';

interface CategoryItem {
    id: number | string;
    name: string;
}

interface CategoryListPageProps {
    onBack: () => void;
    onSearchChange: (query: string) => void;
}

interface Product {
    product_id: number;
    name: string;
    title?: string;
    price: number;
    selling_price: number;
    product_image: string | string[] | { [key: string]: string };
    quantity: number;
    createdAt?: string;
    Catagory?: {
        id: number;
        name: string;
    };
}

export default function CategoryListPage({ onBack, onSearchChange }: CategoryListPageProps) {
    const { go } = useNavigation();
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'name'>("featured");
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showSortDropdown && !(event.target as Element).closest('.relative')) {
                setShowSortDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSortDropdown]);

    // Load categories from data file
    useEffect(() => {
        const categoriesData = getCategories();
        setCategories(categoriesData);
    }, []);

    // Load products based on selected category
    useEffect(() => {
        loadProducts();
    }, [selectedCategory]);

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            let response;

            if (selectedCategory === "All") {
                // Load all products
                const cacheKey = `products-page-1-limit-12`;
                const cachedProducts = productCache.getCachedProducts(cacheKey);

                if (cachedProducts) {
                    setProducts(cachedProducts);
                    setIsLoading(false);
                    return;
                }

                response = await productAPI.getProducts(1, 12);
                if (response.data.status && Array.isArray(response.data.products)) {
                    productCache.setCachedProducts(cacheKey, response.data.products);
                    setProducts(response.data.products);
                }
            } else {
                // Load products by category
                const cacheKey = `category-${selectedCategory}-page-1-limit-12`;
                const cachedProducts = productCache.getCachedProducts(cacheKey);

                if (cachedProducts) {
                    setProducts(cachedProducts);
                    setIsLoading(false);
                    return;
                }

                response = await productAPI.getProductByCategory(selectedCategory, 1, 12);
                if (response.data.status === 'ok' && response.data.data) {
                    const categoryData = response.data.data;
                    if (categoryData && categoryData.Products && Array.isArray(categoryData.Products)) {
                        productCache.setCachedProducts(cacheKey, categoryData.Products);
                        setProducts(categoryData.Products);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    // Dynamic Category List with "All" prepended
    const fullCategories = useMemo<CategoryItem[]>(() => [
        { id: 'all', name: "All" },
        ...categories
    ], [categories]);

    const handleCategoryClick = (categoryName: string) => {
        setSelectedCategory(categoryName);
    };

    const getImageUrl = (productImage: string | string[] | { [key: string]: string } | undefined): string => {
        if (!productImage) return '';
        if (typeof productImage === 'string') {
            return productImage;
        }
        if (Array.isArray(productImage)) {
            return productImage[0] || '';
        }
        if (typeof productImage === 'object') {
            const values = Object.values(productImage);
            return values[0] || '';
        }
        return '';
    };

    // Sort products based on selected option
    const sortedProducts = useMemo(() => {
        if (!products.length) return [];

        const sorted = [...products];

        switch (sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => (a.selling_price || a.price) - (b.selling_price || b.price));
            case 'price-high':
                return sorted.sort((a, b) => (b.selling_price || b.price) - (a.selling_price || a.price));
            case 'name':
                return sorted.sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));
            case 'featured':
            default:
                // Default sorting - could be by createdAt or other logic
                return sorted.sort((a, b) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                );
        }
    }, [products, sortBy]);

    return (
        <div className="min-h-screen bg-[#F7F8FA]">
            <Navbar onSearchChange={onSearchChange} />

            {/* Top Navigation Bar - Unified Back Button */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (onBack) {
                                onBack();
                            } else {
                                go('/');
                            }
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-amber-800 transition-all group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold uppercase tracking-wider">Back to Store</span>
                    </button>
                    <div className="relative lg:hidden">
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors"
                        >
                            <SortAsc size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Sort</span>
                        </button>

                        {/* Sort Dropdown */}
                        {showSortDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                                <div className="py-2">
                                    {[
                                        { id: 'featured', label: 'Featured' },
                                        { id: 'price-low', label: 'Price: Low to High' },
                                        { id: 'price-high', label: 'Price: High to Low' },
                                        { id: 'name', label: 'Name: A to Z' }
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSortBy(option.id as 'featured' | 'price-low' | 'price-high' | 'name');
                                                setShowSortDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === option.id
                                                ? 'text-amber-700 bg-amber-50 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto lg:px-6 py-4 lg:py-8">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* --- SIDEBAR: Fixed on Desktop, Horizontal Scroll on Mobile --- */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white lg:sticky lg:top-24 rounded-xl border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-50 hidden lg:block">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Categories</h2>
                            </div>

                            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto overflow-y-scroll bg-white lg:max-h-[calc(100vh-140px)]"
                                 style={{
                                     scrollbarWidth: 'none',
                                     msOverflowStyle: 'none',
                                    //  WebkitScrollbar: 'none'
                                 }}>
                                {fullCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryClick(cat.name)}
                                        className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink
                                            ${selectedCategory === cat.name
                                                ? 'text-amber-800 bg-amber-50/40 lg:border-r-4 lg:border-amber-700 font-bold'
                                                : 'text-gray-500 hover:bg-gray-50 border-transparent'
                                            }`}
                                    >
                                        <span className={`${selectedCategory === cat.name ? 'text-amber-700' : 'text-gray-400'}`}>
                                            {selectedCategory === cat.name ? '✓' : '⁃'}
                                        </span>
                                        <span className="text-sm tracking-tight">{cat.name}</span>
                                        <ChevronRight size={14} className={`ml-auto hidden lg:block transition-transform ${selectedCategory === cat.name ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* --- MAIN CONTENT AREA --- */}
                    <main className="flex-grow">
                        <div className="bg-white rounded-2xl border border-gray-100 min-h-[80vh] p-5 lg:p-8">

                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-light text-gray-900">
                                        Showing <span className="font-serif italic text-amber-800">{selectedCategory}</span>
                                    </h1>
                                    <p className="text-sm text-gray-400 mt-1">Found {sortedProducts.length} premium pieces in this collection</p>
                                </div>
                            </div>

                            {/* Product Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-4">
                                {isLoading ? (
                                    Array.from({ length: 9 }).map((_, index) => (
                                        <SkeletonLoader key={index} type="card" />
                                    ))
                                ) : sortedProducts.length > 0 ? (
                                    sortedProducts.map((product) => {
                                        const imageUrl = getImageUrl(product.product_image);
                                        return (
                                            <div key={product.product_id}>
                                                <ProductCard
                                                    id={product.product_id}
                                                    name={product.name || product.title || 'Product'}
                                                    price={product.selling_price || product.price}
                                                    image={imageUrl}
                                                    category={product.Catagory?.name || selectedCategory}
                                                    inStock={product.quantity > 0}
                                                />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <p className="text-gray-500">No products found in this category</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>

                </div>
            </div>

            <Footer />
        </div>
    );
}