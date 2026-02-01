import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Clock, ArrowRight, Star } from 'lucide-react';
import { productAPI } from '../services/api';
import { Product, getImageUrl } from '../utils/productUtils';
import { useNavigation } from "../utils/navigation";
import SkeletonLoader from './UI/SkeletonLoader';
import { productCache } from '../services/productCache';

interface Review {
    id: number;
    review_rate: number;
}

interface ProductWithRating extends Product {
    averageRating?: number;
    reviewCount?: number;
}

export default function NewArrivals() {
    const [products, setProducts] = useState<ProductWithRating[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isContentVisible, setIsContentVisible] = useState(false);
    const { go } = useNavigation();
    const [ratingsCache, setRatingsCache] = useState<Record<number, { averageRating: number; reviewCount: number }>>({});

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (!isLoading && products.length > 0) {
            const timer = setTimeout(() => setIsContentVisible(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading, products]);

    const fetchFreshProducts = async () => {
        try {
            const response = await productAPI.getProducts();
            if (response.data.status && Array.isArray(response.data.products)) {
                const newArrivals = response.data.products
                    .sort((a: Product, b: Product) =>
                        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                    )
                    .slice(0, 8);

                productCache.setCachedNewArrivals(newArrivals);
                setProducts(newArrivals.map((p: ProductWithRating) => ({ ...p, ...(ratingsCache[p.product_id] || {}) })));
            }
        } catch (error) {
            console.error('Error fetching fresh products:', error);
        }
    };

    const loadProducts = async () => {
        setIsLoading(true);
        const cached = productCache.getCachedNewArrivals();
        if (cached) {
            setProducts(cached.map((p: ProductWithRating) => ({ ...p, ...(ratingsCache[p.product_id] || {}) })));
            setIsLoading(false);
            fetchFreshProducts();
        } else {
            await fetchFreshProducts();
            setIsLoading(false);
        }
    };

    const fetchProductRating = useCallback(async (productId: number) => {
        if (ratingsCache[productId]) return ratingsCache[productId];
        try {
            const response = await productAPI.getProductReviews(productId);
            const list = response?.data?.reviews || [];
            const reviewCount = list.length;
            const averageRating = reviewCount > 0
                ? list.reduce((sum: number, r: Review) => sum + r.review_rate, 0) / reviewCount
                : 0;
            const data = { averageRating, reviewCount };
            setRatingsCache(prev => ({ ...prev, [productId]: data }));
            return data;
        } catch { return { averageRating: 0, reviewCount: 0 }; }
    }, [ratingsCache]);

    useEffect(() => {
        if (products.length > 0) {
            const productsToFetch = products.filter(p => p.averageRating === undefined);
            if (productsToFetch.length > 0) {
                productsToFetch.forEach(p => fetchProductRating(p.product_id));
            }
        }
    }, [products, fetchProductRating]);

    const calculateDiscount = (price: number, oldPrice: number) => Math.round(((oldPrice - price) / oldPrice) * 100);

    // Show skeleton loaders for product cards when loading
    const showSkeletons = isLoading;

    // If there are no products and we aren't loading, don't show the section at all
    if (!isLoading && products.length === 0) return null;

    return (
        <section className="bg-[#FAFAFA] py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Modern Header - Always Visible */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-[0.2em] text-xs">
                            <Clock size={14} />
                            <span>Just In</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight">
                            New <span className="font-serif italic">Arrivals</span>
                        </h2>
                    </div>
                    <button
                        onClick={() => go('/categories?type=new-arrivals')}
                        className="group flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-amber-700 transition-colors"
                    >
                        Explore the collection
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Product Grid / Loader Area */}
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 transition-all duration-700 ${isContentVisible || isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {showSkeletons
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonLoader key={`skeleton-${i}`} type="card" />
                        ))
                        : (
                            products.map((product) => {
                                const imageUrl = getImageUrl(product.product_image);
                                const displayPrice = product.selling_price || product.price;
                                const oldPrice = product.price > (product.selling_price || 0) ? product.price : undefined;
                                const rating = ratingsCache[product.product_id]?.averageRating || 0;

                                return (
                                    <div
                                        key={product.product_id}
                                        onClick={() => go(`/product/${product.product_id}`)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative overflow-hidden bg-gray-200 shadow-sm">
                                            <div className="absolute top-3 left-3 z-10">
                                                <span className="backdrop-blur-md bg-white/70 text-gray-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                                    <Sparkles size={10} className="text-amber-600 fill-amber-600" />
                                                    New
                                                </span>
                                            </div>

                                            {oldPrice && (
                                                <div className="absolute top-3 right-3 z-10">
                                                    <span className="bg-amber-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold">
                                                        -{calculateDiscount(displayPrice, oldPrice)}%
                                                    </span>
                                                </div>
                                            )}

                                            <img
                                                src={imageUrl}
                                                alt={product.name}
                                                className="w-full h-[20vh] sm:h-[20vh] md:h-[30vh] lg:h-[45vh] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
                                        </div>

                                        <div className="mt-4 space-y-1">
                                            <div className="flex items-center gap-1">
                                                {rating > 0 ? (
                                                    <div className="flex items-center text-amber-500">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="text-[11px] font-bold ml-1 text-gray-700">{rating.toFixed(1)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-medium tracking-wide">NEW SEASON</span>
                                                )}
                                            </div>

                                            <h3 className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                                                {product.name || product.title}
                                            </h3>

                                            <div className="flex items-baseline gap-2">
                                                <span className="text-base font-bold text-gray-900">
                                                    ${displayPrice}
                                                </span>
                                                {oldPrice && (
                                                    <span className="text-xs text-gray-400 line-through font-light">
                                                        ${oldPrice}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                </div>
            </div>
        </section>
    );
}