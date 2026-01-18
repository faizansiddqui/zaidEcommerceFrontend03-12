import { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { productAPI } from '../services/api';
import { productCache } from '../services/productCache';
import { Product, getImageUrl } from '../utils/productUtils';
import { useNavigation } from "../utils/navigation";
import SkeletonLoader from './UI/SkeletonLoader';

// Define Review interface for rating calculations
interface Review {
  id: number;
  user_name: string;
  review_title: string;
  review_text: string;
  review_rate: number;
  review_image?: string;
  createdAt: string;
  user_review_count?: number;
}

interface ProductWithRating extends Product {
  averageRating?: number;
  reviewCount?: number;
}

export default function BestSellers() {
  const [products, setProducts] = useState<ProductWithRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false); // For smooth transition
  const { go } = useNavigation();
  // Add cache for ratings to avoid repeated API calls
  const [ratingsCache, setRatingsCache] = useState<Record<number, { averageRating: number; reviewCount: number }>>({});

  // Add effect for smooth content transition
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsContentVisible(false);
    }
  }, [isLoading, products]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Check cache first (includes local storage)
      const cachedBestSellers = productCache.getCachedBestSellers();
      
      if (cachedBestSellers) {
        // Use cached data initially for instant loading
        const cachedWithRatings = cachedBestSellers.map(product => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));
        setProducts(cachedWithRatings);
        setIsLoading(false);
        
        // Fetch fresh data in background
        fetchFreshProducts();
        return;
      }

      // If no cache, fetch from API
      await fetchFreshProducts();
    } catch (error: unknown) {
      console.error('❌ Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsContentVisible(false);
    }
  };

  const fetchFreshProducts = async () => {
    try {
      const response = await productAPI.getProducts();

      if (response.data.status && Array.isArray(response.data.products)) {
        // Get all products and sort by sales (lifetime bestsellers)
        const allProducts = response.data.products
          .sort((a: Product, b: Product) => {
            // Sort by total sales (assuming higher price indicates more sales, or use quantity as proxy)
            const aScore = (a.quantity || 0) + (a.selling_price || a.price || 0);
            const bScore = (b.quantity || 0) + (b.selling_price || b.price || 0);
            return bScore - aScore; // Higher score first
          })
          .slice(0, 4); // Show only top 4 products
        
        // Cache the results (saves to local storage)
        productCache.setCachedBestSellers(allProducts);
        
        const productsWithRatings = allProducts.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));
        
        setProducts(productsWithRatings);
      } else {
        setProducts([]);
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching fresh products:', error);
    }
  };

  // Function to get rating background color
  const getRatingBgColor = (rate: number) => {
    if (rate <= 1) return 'bg-red-600';
    if (rate <= 3) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  // Function to fetch ratings for a product
  const fetchProductRating = useCallback(async (productId: number) => {
    // If we already have the rating in cache, return it
    if (ratingsCache[productId]) {
      return ratingsCache[productId];
    }

    try {
      const response = await productAPI.getProductReviews(productId);
      const list = response?.data?.reviews || response?.data?.data || [];

      if (Array.isArray(list)) {
        const reviewCount = list.length;
        let averageRating = 0;

        if (reviewCount > 0) {
          const totalRating = list.reduce((sum, review: Review) => sum + review.review_rate, 0);
          averageRating = totalRating / reviewCount;
        }

        const ratingData = { averageRating, reviewCount };

        // Update cache
        setRatingsCache(prev => ({
          ...prev,
          [productId]: ratingData
        }));

        return ratingData;
      }
    } catch (err) {
      console.error(`Failed to load reviews for product ${productId}:`, err);
    }

    // Return default values if failed to fetch
    return { averageRating: 0, reviewCount: 0 };
  }, [ratingsCache]);

  // Function to load ratings for visible products
  const loadRatingsForVisibleProducts = useCallback(async () => {
    // Only load ratings for products that don't already have them
    const productsWithoutRatings = products.filter(product =>
      product.product_id && (product.averageRating === undefined || product.reviewCount === undefined)
    );

    if (productsWithoutRatings.length === 0) return;

    // Process products in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < productsWithoutRatings.length; i += batchSize) {
      const batch = productsWithoutRatings.slice(i, i + batchSize);

      // Fetch ratings for all products in the batch
      const ratingPromises = batch.map(product =>
        fetchProductRating(product.product_id)
      );

      try {
        const ratings = await Promise.all(ratingPromises);

        // Update products with fetched ratings
        setProducts(prevProducts =>
          prevProducts.map(product => {
            const index = batch.findIndex(p => p.product_id === product.product_id);
            if (index !== -1) {
              return {
                ...product,
                averageRating: ratings[index].averageRating,
                reviewCount: ratings[index].reviewCount
              };
            }
            return product;
          })
        );
      } catch (error) {
        console.error('Error fetching ratings for batch:', error);
      }
    }
  }, [products, fetchProductRating]);

  // Load ratings when products change
  useEffect(() => {
    if (products.length > 0) {
      loadRatingsForVisibleProducts();
    }
  }, [products, loadRatingsForVisibleProducts]);

  const handleProductClick = (productId: number) => {
    go(`/product/${productId}`);
  };

  // Load categories from centralized data file (not used for display)
  const filteredProducts = products.slice(0, 8);

  const calculateDiscount = (price: number, oldPrice: number) => {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

  if (isLoading) {
    return (
      <div className="bg-white py-6 xs:py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 xs:mb-8 sm:mb-10 lg:mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="text-amber-700" size={24} />
              <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                Best Selling Products
              </h2>
              <Sparkles className="text-amber-700" size={24} />
            </div>
            <p className="text-xs xs:text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Discover our most popular Islamic decor items, handpicked for you
            </p>
          </div>

          {/* Skeleton Loaders */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonLoader key={index} type="card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-section="bestsellers" className="bg-gradient-to-b from-white to-gray-50 py-6 xs:py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 xs:mb-8 sm:mb-10 lg:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="text-amber-700" size={24} />
            <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              Best Selling Products
            </h2>
            <Sparkles className="text-amber-700" size={24} />
          </div>
          <p className="text-xs xs:text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Discover our most popular Islamic decor items, handpicked for you
          </p>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No bestseller products found</p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 transition-all duration-500 ease-in-out ${
              isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {filteredProducts.map((product) => {
                const imageUrl = getImageUrl(product.product_image);
                const displayPrice = product.selling_price || product.price;
                const oldPrice = product.price > product.selling_price ? product.price : undefined;

                return (
                  <div
                    key={product.product_id}
                    onClick={() => handleProductClick(product.product_id)}
                    className="group cursor-pointer bg-white rounded-lg overflow-hidden sm:hover:shadow-xl sm:transition-all sm:duration-300 sm:transform sm:hover:-translate-y-1"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <div className="absolute top-1.5 xs:top-2 sm:top-3 left-1.5 xs:left-2 sm:left-3 z-10">
                        <span className="px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-full text-[8px] xs:text-[9px] sm:text-xs font-bold uppercase bg-red-600 text-white">
                          Bestseller
                        </span>
                      </div>
                      <img
                        src={imageUrl}
                        alt={product.name || product.title || 'Product'}
                        className="w-full h-full object-cover sm:group-hover:scale-110 sm:transition-transform sm:duration-500"
                      />
                      {product.quantity === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 xs:p-3 sm:p-4 lg:p-5">
                      {/* Rating Display */}
                      {product.averageRating && product.averageRating > 0 ? (
                        <div className="flex items-center gap-1 mb-1 xs:mb-2">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-md ${getRatingBgColor(product.averageRating)}`}>
                            <span className="text-white font-bold text-[10px]">{product.averageRating.toFixed(1)}</span>
                          </div>
                          <span className="text-[9px] xs:text-[10px] text-gray-500">
                            ({product.reviewCount})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 xs:gap-1 mb-1 xs:mb-2">
                          <span className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm text-gray-600 ml-0.5 xs:ml-1">
                            No reviews yet
                          </span>
                        </div>
                      )}

                      <h3 className="text-[10px] xs:text-xs sm:text-sm lg:text-base text-gray-900 font-medium mb-1.5 xs:mb-2 sm:mb-3 line-clamp-2 min-h-[2rem] xs:min-h-[2.5rem] sm:min-h-[3rem] sm:group-hover:text-amber-700 sm:transition-colors">
                        {product.name || product.title || 'Product'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1 xs:gap-1.5 sm:gap-2 lg:gap-3">
                        <span className="text-sm xs:text-base sm:text-lg lg:text-2xl font-bold text-amber-700">
                          ${displayPrice}
                        </span>
                        {oldPrice && (
                          <>
                            <span className="text-xs xs:text-sm sm:text-base lg:text-lg text-gray-400 line-through">
                              ${oldPrice}
                            </span>
                            <span className="bg-green-100 text-green-700 px-1 xs:px-1.5 sm:px-2 py-0.5 xs:py-1 rounded-full text-[8px] xs:text-[9px] sm:text-xs font-semibold">
                              Save {calculateDiscount(displayPrice, oldPrice)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-6 xs:mt-8 sm:mt-10 lg:mt-12">
              <button
                onClick={() => go('/categories')}
                className="relative bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                <div className="relative z-10 flex items-center gap-2">
                  <span className="font-medium">View All Products...</span>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}