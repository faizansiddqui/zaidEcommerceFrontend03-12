import { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from './ProductCard';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { productAPI } from '../../services/api';
import { productCache } from '../../services/productCache';
import { Product, getImageUrl, isProductNew, isProductBestSeller } from '../../utils/productUtils';
import { getCategories } from '../../data/categories';
import { useNavigation } from "../../utils/navigation"; 
import SkeletonLoader from '../UI/SkeletonLoader';

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

export default function ProductGrid({ searchQuery }: { searchQuery?: string }) {
  const { go } = useNavigation();
  const [products, setProducts] = useState<ProductWithRating[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [displayedProducts, setDisplayedProducts] = useState(6); // Show only 6 products initially
  const [isContentVisible, setIsContentVisible] = useState(false); // For smooth transition
  // Add cache for ratings to avoid repeated API calls
  const [ratingsCache, setRatingsCache] = useState<Record<number, { averageRating: number; reviewCount: number }>>({});
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false); // Prevent duplicate background fetches

  // Ref for infinite scroll
  const observer = useRef<IntersectionObserver>();
  const lastProductRef = useRef<HTMLDivElement>(null);

  // Add effect for smooth content transition
  useEffect(() => {
    if (!isLoading && !isInitialLoad && products.length > 0) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsContentVisible(false);
    }
  }, [isLoading, isInitialLoad, products]);

  useEffect(() => {
    // Only load products if this is not the initial load
    if (!isInitialLoad) {
      loadProducts();
    }
    loadCategories();
  }, []);

  // Simulate initial loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
      
      // Check if we have local storage data first
      const cacheKey = `products-page-1-limit-12`;
      const cachedProducts = productCache.getCachedProducts(cacheKey);
      
      if (cachedProducts) {
        setProducts(cachedProducts);
        setHasMore(cachedProducts.length === 12);
        setCurrentPage(2);
        setIsLoading(false);
        
        // Try to fetch fresh data in background (may fail due to network)
        fetchFreshProductsWithFallback();
      } else {
        // Try API first, then fallback to any cached data
        fetchProductsWithFallback();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchFreshProductsWithFallback = async () => {
    try {
      const response = await productAPI.getProducts(1, 12);
      
      if (response.data.status && Array.isArray(response.data.products)) {
        const cacheKey = `products-page-1-limit-12`;
        
        // Cache fresh products (saves to local storage)
        productCache.setCachedProducts(cacheKey, response.data.products);
        
        // Update state with fresh data
        const productsWithCache = response.data.products.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));
        
        setProducts(productsWithCache);
        setHasMore(response.data.products.length === 12);
        setCurrentPage(2);
      }
    } catch (error) {
      console.error('❌ Network error, keeping cached data:', error);
      // Keep showing cached data - no action needed since already loaded
    }
  };

  const fetchProductsWithFallback = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getProducts(1, 12);
      
      if (response.data.status && Array.isArray(response.data.products)) {
        console.log('✅ API call successful');
        const cacheKey = `products-page-1-limit-12`;
        
        // Cache fresh products
        productCache.setCachedProducts(cacheKey, response.data.products);
        
        const productsWithCache = response.data.products.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));
        
        setProducts(productsWithCache);
        setHasMore(response.data.products.length === 12);
        setCurrentPage(2);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('❌ API failed, trying fallback:', error);
      
      // Fallback: Try to get any cached data
      const allCached = productCache.getAllCachedProducts();
      if (allCached.length > 0) {
        console.log('🔄 Fallback: Using cached products due to network failure');
        setProducts(allCached.slice(0, 12));
        setHasMore(allCached.length >= 12);
        setCurrentPage(2);
      } else {
        console.log('📭 No cached data available');
        setProducts([]);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset pagination when category or search changes
  useEffect(() => {
    setProducts([]);
    setCurrentPage(1);
    setHasMore(true);
    setDisplayedProducts(6); // Reset to 6 products
    
    if (selectedCategory === 'All Products') {
      const cacheKey = `products-page-1-limit-12`;
      const cachedProducts = productCache.getCachedProducts(cacheKey);
      
      if (cachedProducts) {
        setProducts(cachedProducts);
        setHasMore(cachedProducts.length === 12);
        setCurrentPage(2);
        setIsLoading(false);
        
        // Fetch fresh data in background
        if (!isBackgroundFetching) {
          fetchFreshProductsWithFallback();
        }
      } else {
        loadProducts(true);
      }
    } else if (selectedCategory !== 'Uncategorized') {
      const cacheKey = `category-${selectedCategory}-page-1-limit-12`;
      const cachedProducts = productCache.getCachedProducts(cacheKey);
      
      if (cachedProducts) {
        setProducts(cachedProducts);
        setHasMore(cachedProducts.length === 12);
        setCurrentPage(2);
        setIsLoading(false);
        
        // Fetch fresh data in background
        if (!isBackgroundFetching) {
          fetchFreshCategoryProducts(selectedCategory);
        }
      } else {
        loadProductsByCategory(selectedCategory, true);
      }
    }
  }, [selectedCategory, searchQuery]);

  const fetchFreshCategoryProducts = async (categoryName: string) => {
    if (isBackgroundFetching) return;
    
    setIsBackgroundFetching(true);
    try {
      const response = await productAPI.getProductByCategory(categoryName, 1, 12);
      
      if (response.data.status === 'ok' && response.data.data) {
        const categoryData = response.data.data;
        if (categoryData && categoryData.Products && Array.isArray(categoryData.Products)) {
          const cacheKey = `category-${categoryName}-page-1-limit-12`;
          
          // Cache the fresh products (saves to local storage)
          productCache.setCachedProducts(cacheKey, categoryData.Products);
          
          // Update state with fresh data
          const productsWithCache = categoryData.Products.map((product: Product) => ({
            ...product,
            ...(ratingsCache[product.product_id] || {})
          }));
          
          setProducts(productsWithCache);
          setHasMore(categoryData.Products.length === 12);
          setCurrentPage(2);
        }
      }
    } catch (error) {
      console.error('❌ ProductGrid: Error fetching fresh category products:', error);
    } finally {
      setIsBackgroundFetching(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
        loadMoreProducts();
      }
    }, options);

    if (lastProductRef.current) {
      observer.current.observe(lastProductRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, currentPage, selectedCategory, searchQuery]);

  const loadProducts = async (reset: boolean = false) => {
    const page = reset ? 1 : currentPage;
    const cacheKey = `products-page-${page}-limit-12`;
    
    if (reset) {
      setIsLoading(true);
      setDisplayedProducts(6); // Reset to 6 products
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Check cache first
      const cachedProducts = productCache.getCachedProducts(cacheKey);
      if (cachedProducts && !reset) {
        // Load from cache for pagination
        const productsWithCache = cachedProducts.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        setProducts(prev => [...prev, ...productsWithCache]);
        setHasMore(cachedProducts.length === 12);
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
        return;
      }

      const response = await productAPI.getProducts(page, 12);

      if (response.data.status && Array.isArray(response.data.products)) {
        const productsWithCache = response.data.products.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        // Cache the products
        productCache.setCachedProducts(cacheKey, response.data.products);

        if (reset) {
          setProducts(productsWithCache);
        } else {
          setProducts(prev => [...prev, ...productsWithCache]);
        }

        // Check if there are more products to load
        setHasMore(response.data.products.length === 12);
        if (!reset) {
          setCurrentPage(prev => prev + 1);
        } else {
          setCurrentPage(2);
        }
      } else {
        if (reset) {
          setProducts([]);
        }
        setHasMore(false);
      }
    } catch (error: unknown) {
      console.error('❌ Error loading products:', error);
      if (reset) {
        setProducts([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsContentVisible(false); // Reset visibility when loading starts
    }
  };

  const loadMoreProducts = async () => {
    if (selectedCategory === 'All Products') {
      loadProducts(false);
    } else if (selectedCategory !== 'Uncategorized') {
      loadProductsByCategory(selectedCategory, false);
    }
  };

  const loadProductsByCategory = async (categoryName: string, reset: boolean = true) => {
    const page = reset ? 1 : currentPage;
    const cacheKey = `category-${categoryName}-page-${page}-limit-12`;
    
    if (reset) {
      setIsLoading(true);
      setDisplayedProducts(6); // Reset to 6 products
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Check cache first
      const cachedProducts = productCache.getCachedProducts(cacheKey);
      if (cachedProducts && !reset) {
        // Load from cache for pagination
        const productsWithCache = cachedProducts.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        setProducts(prev => [...prev, ...productsWithCache]);
        setHasMore(cachedProducts.length === 12);
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
        return;
      }

      const response = await productAPI.getProductByCategory(categoryName, page, 12);

      if (response.data.status === 'ok' && response.data.data) {
        const categoryData = response.data.data;
        if (categoryData && categoryData.Products && Array.isArray(categoryData.Products)) {
          const productsWithCache = categoryData.Products.map((product: Product) => ({
            ...product,
            ...(ratingsCache[product.product_id] || {})
          }));

          // Cache the products
          productCache.setCachedProducts(cacheKey, categoryData.Products);

          if (reset) {
            setProducts(productsWithCache);
          } else {
            setProducts(prev => [...prev, ...productsWithCache]);
          }

          // Check if there are more products to load
          setHasMore(categoryData.Products.length === 12);
          if (!reset) {
            setCurrentPage(prev => prev + 1);
          } else {
            setCurrentPage(2);
          }
        } else {
          console.warn('⚠️ No products found for category:', categoryName);
          if (reset) {
            setProducts([]);
          }
          setHasMore(false);
        }
      } else {
        console.warn('⚠️ Invalid response format for category:', categoryName);
        if (reset) {
          setProducts([]);
        }
        setHasMore(false);
      }
    } catch (error: unknown) {
      console.error(`❌ Error loading products for category ${categoryName}:`, error);
      if (reset) {
        setProducts([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
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

  const loadCategories = () => {
    // Load categories from centralized data file
    const categoryData = getCategories();
    const categoryNames = categoryData.map(cat => cat.name);

    // Check if there are any uncategorized products
    const hasUncategorized = products.some(p => !p.Catagory || !p.Catagory.name);

    const allCategories = ['All Products', ...categoryNames];
    if (hasUncategorized) {
      allCategories.push('Uncategorized');
    }

    setCategories(allCategories);
  };

  const filteredProducts = products.filter((product) => {
    // For Uncategorized, filter products without category
    if (selectedCategory === 'Uncategorized') {
      const hasNoCategory = !product.Catagory || !product.Catagory.name;
      if (!hasNoCategory) return false;
    }
    // Note: Category filtering is now done by backend API, except for Uncategorized

    // Search filtering
    const productCategory = product.Catagory?.name || 'Uncategorized';
    const matchesSearch = !searchQuery ||
      (product.name || product.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      productCategory.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (a.selling_price || a.price) - (b.selling_price || b.price);
    }
    if (sortBy === 'price-high') {
      return (b.selling_price || b.price) - (a.selling_price || a.price);
    }
    if (sortBy === 'name') {
      return (a.name || a.title || '').localeCompare(b.name || b.title || '');
    }
    // Featured: Show new products first, then bestsellers, then others
    if (sortBy === 'featured') {
      const aIsNew = isProductNew(a);
      const bIsNew = isProductNew(b);
      const aIsBestSeller = isProductBestSeller(a);
      const bIsBestSeller = isProductBestSeller(b);

      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      if (aIsBestSeller && !bIsBestSeller) return -1;
      if (!aIsBestSeller && bIsBestSeller) return 1;
      return 0;
    }
    return 0;
  });

  if (isLoading || isInitialLoad) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
              <SlidersHorizontal size={16} className="mr-2" />
              Curated Selection
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Our Featured Collection
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Explore our carefully curated selection of premium Islamic art and decor
            </p>
          </div>

          {/* Skeleton Loaders */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} type="card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
            <SlidersHorizontal size={16} className="mr-2" />
            Curated Selection
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Our Featured Collection
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Explore our carefully curated selection of premium Islamic art and decor
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-amber-700 text-amber-700 px-4 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors shadow-md"
          >
            <SlidersHorizontal size={20} />
            {showMobileFilters ? 'Hide Filters' : 'Show Filters & Categories'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Vertical Category Tabs - Left Side on Desktop, Collapsible on Mobile */}
          <div className={`lg:w-56 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Mobile: Styled Card */}
            <div className="lg:hidden bg-white rounded-xl shadow-lg p-4 mb-4 border border-amber-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Filter size={20} className="text-amber-600" />
                  Categories
                </h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowMobileFilters(false);
                    }}
                    className={`px-3 py-2.5 text-sm font-medium transition-all rounded-lg ${selectedCategory === category
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-amber-50 hover:text-amber-700 border border-gray-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: Vertical Sidebar */}
            <div className="hidden lg:flex lg:flex-col gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-3 text-sm font-medium transition-all rounded-lg text-left group ${selectedCategory === category
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 border border-gray-200 hover:border-amber-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category}</span>
                    {selectedCategory === category && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Sort and Count Bar */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-amber-600 rounded-full"></div>
                  <p className="text-sm font-semibold text-gray-700">
                    Showing <span className="text-amber-700 text-lg">{sortedProducts.length}</span> products
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <SlidersHorizontal size={16} className="text-amber-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer outline-none"
                  >
                    <option value="featured">✨ Featured</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💎 Price: High to Low</option>
                    <option value="name">🔤 Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 transition-all duration-500 ease-in-out ${
              isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {sortedProducts.slice(0, displayedProducts).map((product, index) => {
                const imageUrl = getImageUrl(product.product_image);
                const isNew = isProductNew(product);
                const isBestSeller = isProductBestSeller(product);
                const badge = isNew ? 'new' : isBestSeller ? 'bestseller' : null;
                const displayPrice = product.selling_price || product.price;
                const oldPrice = product.price > product.selling_price ? product.price : undefined;

                return (
                  <div
                    key={product.product_id}
                    ref={index === displayedProducts - 1 ? lastProductRef : null}
                  >
                    <ProductCard
                      id={product.product_id}
                      name={product.name || product.title || 'Product'}
                      price={displayPrice}
                      image={imageUrl}
                      category={product.Catagory?.name || ''}
                      inStock={product.quantity > 0}
                      badge={badge}
                      oldPrice={oldPrice}
                      // Pass rating data
                      averageRating={product.averageRating}
                      reviewCount={product.reviewCount}
                    />
                  </div>
                );
              })}
            </div>

            {/* Show More Button - Redirect to Categories */}
            {sortedProducts.length > displayedProducts && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => go('/categories')}
                  className="relative bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                  {isLoadingMore ? (
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="font-medium">View All Products...</span>
                    </div>
                  ) : (
                    <span className="relative z-10 font-medium">View All Products...</span>
                  )}
                </button>
              </div>
            )}

            {/* Loading More Indicator */}
            {isLoadingMore && sortedProducts.length <= displayedProducts && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-700"></div>
                  <span className="text-gray-600">Loading more products...</span>
                </div>
              </div>
            )}

            {/* No More Products Indicator */}
            {!hasMore && sortedProducts.length > 0 && sortedProducts.length <= displayedProducts && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">You've reached the end of our collection</p>
              </div>
            )}

            {sortedProducts.length === 0 && !isLoading && (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <div className="text-gray-400 mb-4">
                  <Filter size={48} className="mx-auto" />
                </div>
                <p className="text-lg text-gray-500 font-medium">No products found</p>
                <p className="text-sm text-gray-400 mt-2">Try selecting a different category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}