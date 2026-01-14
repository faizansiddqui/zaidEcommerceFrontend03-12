// Product Cache Service - Prevents redundant API calls
import { Product } from '../utils/productUtils';

interface ProductSpecification {
  specification_id?: number;
  key?: string;
  value?: string;
}

interface ProductDetailData {
  product_id: number;
  name: string;
  title?: string;
  price: number;
  selling_price: number;
  product_image: string | string[] | { [key: string]: string };
  product_video?: string;
  quantity: number;
  description?: string;
  ProductSpecification?: ProductSpecification[];
  ProductSpecifications?: ProductSpecification[];
  catagory_id?: number;
}


interface ProductDetailCache {
  product: ProductDetailData;
  timestamp: number;
}

interface CachedData {
  products: Product[];
  timestamp: number;
  bestSellers: Product[];
  newArrivals: Product[];
}

interface ProductCache {
  [key: string]: CachedData;
}

class ProductCacheService {
  private cache: ProductCache = {};
  private productDetailCache: { [key: number]: ProductDetailCache } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Generate cache key based on API endpoint and parameters
  private generateCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}${params ? JSON.stringify(params) : ''}`;
  }

  // Check if cache is valid (not expired)
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  // Get cached products
  getCachedProducts(endpoint: string, params?: any): Product[] | null {
    const key = this.generateCacheKey(endpoint, params);
    const cached = this.cache[key];

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.products;
    }
    return null;
  }

  // Cache products with timestamp
  setCachedProducts(endpoint: string, products: Product[], params?: any): void {
    const key = this.generateCacheKey(endpoint, params);
    
    this.cache[key] = {
      products,
      timestamp: Date.now(),
      bestSellers: [],
      newArrivals: []
    };
  }

  // Get cached bestsellers
  getCachedBestSellers(): Product[] | null {
    const cached = this.cache['bestsellers'];

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.bestSellers;
    }
    return null;
  }

  // Cache bestsellers
  setCachedBestSellers(products: Product[]): void {
    this.cache['bestsellers'] = {
      products: [],
      bestSellers: products,
      newArrivals: [],
      timestamp: Date.now()
    };
  }

  // Get cached new arrivals
  getCachedNewArrivals(): Product[] | null {
    const cached = this.cache['newarrivals'];

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.newArrivals;
    }

    return null;
  }

  // Cache new arrivals
  setCachedNewArrivals(products: Product[]): void {
    this.cache['newarrivals'] = {
      products: [],
      bestSellers: [],
      newArrivals: products,
      timestamp: Date.now()
    };
  }

  // Clear cache (for manual refresh or logout)
  clearCache(): void {
    this.cache = {};
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    Object.keys(this.cache).forEach(key => {
      if (!this.isCacheValid(this.cache[key].timestamp)) {
        delete this.cache[key];
      }
    });
  }

  // Get cache stats for debugging
  getCacheStats(): { [key: string]: { count: number; age: number } } {
    const stats: { [key: string]: { count: number; age: number } } = {};

    Object.keys(this.cache).forEach(key => {
      const cached = this.cache[key];
      stats[key] = {
        count: cached.products.length || cached.bestSellers.length || cached.newArrivals.length,
        age: Math.floor((Date.now() - cached.timestamp) / 1000) // age in seconds
      };
    });

    return stats;
  }

  // Get cached product details
  getCachedProductDetails(productId: number): ProductDetailCache | null {
    const cached = this.productDetailCache[productId];

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached;
    }
    return null;
  }

  // Cache product details (main content only)
  setCachedProductDetails(
    productId: number,
    product: ProductDetailData
  ): void {
    this.productDetailCache[productId] = {
      product,
      timestamp: Date.now()
    };
  }

  // Clear product cache
  clearProductCache(productId?: number): void {
    if (productId) {
      delete this.productDetailCache[productId];
    } else {
      this.productDetailCache = {};
    }
  }

  // Clear product detail cache (alias for clearProductCache)
  clearProductDetailCache(productId?: number): void {
    this.clearProductCache(productId);
  }
}

// Export singleton instance
export const productCache = new ProductCacheService();
