import { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, ShoppingBag, Star, Crown } from 'lucide-react';
import { productAPI } from '../services/api';
import { productCache } from '../services/productCache';
import { Product, getImageUrl } from '../utils/productUtils';
import { useNavigation } from "../utils/navigation";
import SkeletonLoader from './UI/SkeletonLoader';

interface Review {
  id: number;
  review_rate: number;
}

interface ProductWithRating extends Product {
  averageRating?: number;
  reviewCount?: number;
}

export default function BestSellers() {
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
        const allProducts = response.data.products
          .sort((a: Product, b: Product) => {
            const aScore = (a.quantity || 0) + (a.selling_price || a.price || 0);
            const bScore = (b.quantity || 0) + (b.selling_price || b.price || 0);
            return bScore - aScore;
          })
          .slice(0, 4);

        productCache.setCachedBestSellers(allProducts);
        setProducts(allProducts.map((p: Product) => ({ ...p, ...(ratingsCache[p.product_id] || {}) })));
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    const cached = productCache.getCachedBestSellers();
    if (cached) {
      setProducts(cached.map((p: Product) => ({ ...p, ...(ratingsCache[p.product_id] || {}) })));
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
      const averageRating = reviewCount > 0 ? list.reduce((sum: number, r: Review) => sum + r.review_rate, 0) / reviewCount : 0;
      const data = { averageRating, reviewCount };
      setRatingsCache(prev => ({ ...prev, [productId]: data }));
      return data;
    } catch { return { averageRating: 0, reviewCount: 0 }; }
  }, [ratingsCache]);

  useEffect(() => {
    if (products.length > 0) {
      products.filter((p: ProductWithRating) => p.averageRating === undefined).forEach((p: ProductWithRating) => fetchProductRating(p.product_id));
    }
  }, [products, fetchProductRating]);

  // If there are no products and we aren't loading, don't show the section at all
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="bg-[#FCFBFA] py-16 sm:pt-24 sm:pb-5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section - Always Visible */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-widest text-xs mb-3">
              <Sparkles size={16} />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
              Best Selling <span className="font-serif italic text-amber-700">Pieces</span>
            </h2>
          </div>
          <button
            onClick={() => go('/categories?type=best-sellers')}
            className="group flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-amber-700 transition-all"
          >
            Browse Full Collection
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Product Grid / Loader Area */}
        <div className={`grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-700 ${isContentVisible || isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex flex-col h-full">
                <SkeletonLoader type="card" />
              </div>
            ))
          ) : (
            products.map((product) => {
              const imageUrl = getImageUrl(product.product_image);
              const displayPrice = product.selling_price || product.price;
              const oldPrice = product.price > (product.selling_price || 0) ? product.price : undefined;
              const rating = ratingsCache[product.product_id]?.averageRating || 0;

              return (
                <div
                  key={product.product_id}
                  onClick={() => go(`/product/${product.product_id}`)}
                  className="group cursor-pointer flex flex-col h-full hover:shadow-amber-900/5 transition-all duration-500"
                >
                  {/* Image Container */}
                  <div className="relative rounded-1xl overflow-hidden bg-gray-50">
                    <div className="absolute top-4 left-4 z-10">
                      <div className="relative group/badge">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 blur-[4px] opacity-50 rounded-full"></div>
                        <span className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                          <Crown size={10} className="text-amber-400 fill-amber-400" />
                          Trending
                        </span>
                      </div>
                    </div>

                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-[20vh] sm:h-[20vh] md:h-[30vh] lg:h-[45vh] object-cover transition-transform duration-1000 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white text-gray-900 p-4 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <ShoppingBag size={20} />
                      </div>
                    </div>

                    {product.quantity === 0 && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase">Sold Out</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-2 pt-5 pb-2 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={14} fill={rating > 0 ? "currentColor" : "none"} />
                        <span className="text-xs font-bold text-gray-700">{rating > 0 ? rating.toFixed(1) : "New"}</span>
                      </div>
                      {oldPrice && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          {Math.round(((oldPrice - displayPrice) / oldPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-medium text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors h-10">
                      {product.name || product.title}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-gray-900">
                        ${displayPrice}
                      </span>
                      {oldPrice && (
                        <span className="text-sm text-gray-400 line-through font-light">
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