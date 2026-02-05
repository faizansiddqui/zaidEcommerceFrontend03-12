import { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from './ProductCard';
import { SlidersHorizontal, Check, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { productAPI } from '../../services/api';
import { productCache } from '../../services/productCache';
import { Product, getImageUrl, isProductNew, isProductBestSeller } from '../../utils/productUtils';
import { getCategories } from '../../data/categories';
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
  const [products, setProducts] = useState<ProductWithRating[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState('featured');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Add cache for ratings to avoid repeated API calls
  const [ratingsCache, setRatingsCache] = useState<Record<number, { averageRating: number; reviewCount: number }>>({});
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false); // Prevent duplicate background fetches

  const PRODUCTS_LIMIT = 1000;

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };


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
      const cacheKey = `products-page-1-limit-${PRODUCTS_LIMIT}`;
      const cachedProducts = productCache.getCachedProducts(cacheKey);

      if (cachedProducts) {
        setProducts(cachedProducts);
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
      const response = await productAPI.getProducts(1, PRODUCTS_LIMIT);

      if (response.data.status && Array.isArray(response.data.products)) {
        const cacheKey = `products-page-1-limit-${PRODUCTS_LIMIT}`;

        // Cache fresh products (saves to local storage)
        productCache.setCachedProducts(cacheKey, response.data.products);

        // Update state with fresh data
        const productsWithCache = response.data.products.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        setProducts(productsWithCache);
      }
    } catch (error) {
      console.error('Error: network issue while refreshing products', error);
      // Keep showing cached data - no action needed since already loaded
    }
  };

  const fetchProductsWithFallback = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getProducts(1, PRODUCTS_LIMIT);

      if (response.data.status && Array.isArray(response.data.products)) {
        console.log('âœ… API call successful');
        const cacheKey = `products-page-1-limit-${PRODUCTS_LIMIT}`;

        // Cache fresh products
        productCache.setCachedProducts(cacheKey, response.data.products);

        const productsWithCache = response.data.products.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        setProducts(productsWithCache);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error: product API failed, attempting fallback', error);

      // Fallback: Try to get any cached data
      const allCached = productCache.getAllCachedProducts();
      if (allCached.length > 0) {
        console.log('Fallback: using cached products due to network failure');
        setProducts(allCached);
      } else {
        console.log('No cached data available');
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset pagination when category or search changes
  useEffect(() => {
    setProducts([]);

    if (selectedCategory === 'All Products') {
      const cacheKey = `products-page-1-limit-${PRODUCTS_LIMIT}`;
      const cachedProducts = productCache.getCachedProducts(cacheKey);

      if (cachedProducts) {
        setProducts(cachedProducts);
        setIsLoading(false);

        // Fetch fresh data in background
        if (!isBackgroundFetching) {
          fetchFreshProductsWithFallback();
        }
      } else {
        loadProducts();
      }
    } else if (selectedCategory !== 'Uncategorized') {
      const cacheKey = `category-${selectedCategory}-page-1-limit-${PRODUCTS_LIMIT}`;
      const cachedProducts = productCache.getCachedProducts(cacheKey);

      if (cachedProducts) {
        setProducts(cachedProducts);
        setIsLoading(false);

        // Fetch fresh data in background
        if (!isBackgroundFetching) {
          fetchFreshCategoryProducts(selectedCategory);
        }
      } else {
        loadProductsByCategory(selectedCategory);
      }
    }
  }, [selectedCategory, searchQuery]);

  const fetchFreshCategoryProducts = async (categoryName: string) => {
    if (isBackgroundFetching) return;

    setIsBackgroundFetching(true);
    try {
      const response = await productAPI.getProductByCategory(categoryName, 1, PRODUCTS_LIMIT);

      if (response.data.status === 'ok' && response.data.data) {
        const categoryData = response.data.data;
        if (categoryData && categoryData.Products && Array.isArray(categoryData.Products)) {
          const cacheKey = `category-${categoryName}-page-1-limit-${PRODUCTS_LIMIT}`;

          // Cache the fresh products (saves to local storage)
          productCache.setCachedProducts(cacheKey, categoryData.Products);

          // Update state with fresh data
          const productsWithCache = categoryData.Products.map((product: Product) => ({
            ...product,
            ...(ratingsCache[product.product_id] || {})
          }));

          setProducts(productsWithCache);
        }
      }
    } catch (error) {
      console.error('Error fetching fresh category products:', error);
    } finally {
      setIsBackgroundFetching(false);
    }
  };

  const loadProducts = async () => {
    const cacheKey = `products-page-1-limit-${PRODUCTS_LIMIT}`;

    setIsLoading(true);

    try {
      // Check cache first
      const cachedProducts = productCache.getCachedProducts(cacheKey);
      if (cachedProducts) {
        const productsWithCache = cachedProducts.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        setProducts(productsWithCache);
        setIsLoading(false);
        return;
      }

      const response = await productAPI.getProducts(1, PRODUCTS_LIMIT);

      if (response.data.status && Array.isArray(response.data.products)) {
        const productsWithCache = response.data.products.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        // Cache the products
        productCache.setCachedProducts(cacheKey, response.data.products);

        setProducts(productsWithCache);
      } else {
        setProducts([]);
      }
    } catch (error: unknown) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductsByCategory = async (categoryName: string) => {
    const cacheKey = `category-${categoryName}-page-1-limit-${PRODUCTS_LIMIT}`;

    setIsLoading(true);

    try {
      // Check cache first
      const cachedProducts = productCache.getCachedProducts(cacheKey);
      if (cachedProducts) {
        const productsWithCache = cachedProducts.map((product: Product) => ({
          ...product,
          ...(ratingsCache[product.product_id] || {})
        }));

        setProducts(productsWithCache);
        setIsLoading(false);
        return;
      }

      const response = await productAPI.getProductByCategory(categoryName, 1, PRODUCTS_LIMIT);

      if (response.data.status === 'ok' && response.data.data) {
        const categoryData = response.data.data;
        if (categoryData && categoryData.Products && Array.isArray(categoryData.Products)) {
          const productsWithCache = categoryData.Products.map((product: Product) => ({
            ...product,
            ...(ratingsCache[product.product_id] || {})
          }));

          // Cache the products
          productCache.setCachedProducts(cacheKey, categoryData.Products);

          setProducts(productsWithCache);
        } else {
          console.warn('Warning: no products found for category', categoryName);
          setProducts([]);
        }
      } else {
        console.warn('Warning: invalid response format for category', categoryName);
        setProducts([]);
      }
    } catch (error: unknown) {
      console.error(`Error loading products for category ${categoryName}:`, error);
      setProducts([]);
    } finally {
      setIsLoading(false);
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

  // Show skeleton loaders for product cards when loading
  const showSkeletons = isLoading || isInitialLoad;

  return (

    <div className="bg-white min-h-[100%]">
      {/* 1. Slim Top Info Bar */}
      <div className="bg-white border-b border-gray-200">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pl-9 pb-5 pt-5 gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-widest text-xs mb-3">
              <SlidersHorizontal size={16} className="" />
              <span>Featured Collection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
              Our Featured <span className="font-serif italic text-amber-700">Products</span>
            </h2>
          </div>
        </div>
      </div>

      {/* 2. & 3. Combined Filter & Main Section */}
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row p-2 lg:p-4 gap-4">

        {/* Sidebar - Hidden on Mobile, Persistent on Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white border border-gray-200 self-start sticky top-24">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Filters</h3>
          </div>
          <div className="p-4">
            <p className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Categories</p>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border transition-colors flex items-center justify-center ${selectedCategory === cat ? 'bg-amber-700 border-amber-700' : 'border-gray-300 group-hover:border-amber-500'}`}>
                    {selectedCategory === cat && <Check size={12} className="text-white" />}
                  </div>
                  <input type="radio" className="hidden" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} />
                  <span className={`text-sm ${selectedCategory === cat ? 'text-amber-700 font-medium' : 'text-gray-700'}`}>{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">

          {/* MOBILE ONLY: Category Dropdown */}
          <div className="lg:hidden mb-4">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium appearance-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
          </div>

          {/* Sort Bar - Horizontal Scrolling on all views */}
          <div className="bg-white border border-gray-200 mb-4 flex items-center justify-between overflow-hidden rounded-sm">
            <div className="flex items-center flex-1 overflow-hidden">
              <div className="px-4 py-3 border-r border-gray-100 hidden sm:block bg-gray-50/50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Sort By</span>
              </div>
              <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { id: 'featured', label: 'Popularity' },
                  { id: 'price-low', label: 'Price: Low-High' },
                  { id: 'price-high', label: 'Price: High-Low' },
                  { id: 'name', label: 'Newest First' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`px-5 py-3 text-xs sm:text-sm whitespace-nowrap transition-all relative flex-none ${sortBy === option.id
                      ? 'text-amber-800 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-700'
                      : 'text-gray-500 hover:text-amber-700'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Arrows (Desktop Only) */}
            <div className="hidden sm:flex items-center gap-2 px-4 border-l border-gray-100 bg-white h-full py-2">
              <p className='text-sm font-medium text-gray-700'>{sortedProducts.length} Items</p>
              <button onClick={() => scroll('left')} className="p-1.5 rounded-full hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all">
                <ChevronLeft size={16} className="text-gray-400" />
              </button>
              <button onClick={() => scroll('right')} className="p-1.5 rounded-full hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all">
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* 4. Horizontal Product Container */}
          <div className="relative">
            {!showSkeletons && sortedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center no-scrollbar py-24 bg-white border border-dashed border-gray-200 rounded-xl">
                <ShoppingBag size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="text-sm text-gray-400">Try selecting a different category or clear filters.</p>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="flex flex-nowrap overflow-x-auto scroll-smooth gap-1 pb-4 w-full"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                {showSkeletons
                  ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex-none w-[45vw] sm:w-[30vw] lg:w-[20vw]">
                      <SkeletonLoader type="card" />
                    </div>
                  ))
                  : sortedProducts.map((product) => (
                    <div
                      key={product.product_id}
                      className="flex-none w-[45vw] sm:w-[30vw] lg:w-[20vw] scroll-snap-align-start"
                    >
                      <ProductCard {...product} id={product.product_id} image={getImageUrl(product.product_image)} inStock={product.quantity > 0} /> {/* Pass id, image using getImageUrl utility and inStock based on quantity */}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

