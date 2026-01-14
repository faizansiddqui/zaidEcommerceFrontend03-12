import { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { productAPI } from '../services/api';
import { productCache } from '../services/productCache';
import ProductCard from '../components/Product/ProductCard';
import ProductDetails from '../components/Product/ProductDetails';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { Product, getImageUrl, isProductNew, isProductBestSeller } from '../utils/productUtils';
import { useNavigation } from "../utils/navigation";
import SkeletonLoader from '../components/UI/SkeletonLoader';

interface SearchPageProps {
    onBack: () => void;
    onSearchChange: (query: string) => void;
}

export default function SearchPage({ onBack, onSearchChange }: SearchPageProps) {
    const { go } = useNavigation();

    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Load all products for suggestions
    useEffect(() => {
        const loadAllProducts = async () => {
            try {
                // Check cache first
                const cachedProducts = productCache.getCachedProducts('all-products-suggestions');
                if (cachedProducts) {
                    // Store for suggestions
                    setSuggestions(cachedProducts);
                    return;
                }

                const response = await productAPI.getProducts();
                if (response.data.status && Array.isArray(response.data.products)) {
                    // Cache all products for suggestions
                    productCache.setCachedProducts('all-products-suggestions', response.data.products);
                    // Store for suggestions
                    setSuggestions(response.data.products);
                } else if (Array.isArray(response.data)) {
                    // Direct array response
                    productCache.setCachedProducts('all-products-suggestions', response.data);
                    setSuggestions(response.data);
                }
            } catch (error) {
                console.error('Error loading products for suggestions:', error);
            }
        };
        loadAllProducts();
    }, []);

    // Auto-perform search when component loads with a query parameter from navbar
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            setSearchQuery(decodeURIComponent(query));
            performSearch(decodeURIComponent(query));
        }
    }, [window.location.search]);

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setProducts([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        const cacheKey = `search-${query}-page-1-limit-12`;

        try {
            // Check cache first
            const cachedProducts = productCache.getCachedProducts(cacheKey);
            if (cachedProducts) {
                // Load from cache
                if (Array.isArray(cachedProducts)) {
                    setProducts(cachedProducts);
                } else if (typeof cachedProducts === 'object' && 'product_id' in cachedProducts) {
                    // Single product object
                    setProducts([cachedProducts]);
                }
                setIsLoading(false);
                return;
            }

            const response = await productAPI.searchProduct(query);

            // Handle the correct response structure from search API
            let searchResults: Product[] = [];

            if (response.data && response.data.result) {
                // Check if result is a single product object or an array
                if (Array.isArray(response.data.result)) {
                    searchResults = response.data.result;
                } else if (response.data.result.product_id) {
                    // Single product object
                    searchResults = [response.data.result];
                } else if (response.data.result.products && Array.isArray(response.data.result.products)) {
                    // Products array within result
                    searchResults = response.data.result.products;
                }
            } else if (response.data.status && Array.isArray(response.data.products)) {
                searchResults = response.data.products;
            } else if (response.data.status && response.data.data && Array.isArray(response.data.data)) {
                searchResults = response.data.data;
            } else if (Array.isArray(response.data)) {
                // Direct array response
                searchResults = response.data;
            } else {
                // Fallback: filter from all products
                const queryLower = query.toLowerCase();
                searchResults = suggestions.filter((product) => {
                    const name = (product.name || product.title || '').toLowerCase();
                    const description = (product.description || '').toLowerCase();
                    const category = product.Catagory?.name?.toLowerCase() || '';
                    return name.includes(queryLower) ||
                        description.includes(queryLower) ||
                        category.includes(queryLower);
                });
            }

            // Cache search results
            if (searchResults.length > 0) {
                productCache.setCachedProducts(cacheKey, searchResults);
            }

            setProducts(searchResults);
        } catch (error: unknown) {
            console.error('❌ Error searching products:', error);
            // Fallback: filter from all products
            const queryLower = query.toLowerCase();
            const filtered = suggestions.filter((product) => {
                const name = (product.name || product.title || '').toLowerCase();
                const description = (product.description || '').toLowerCase();
                const category = product.Catagory?.name?.toLowerCase() || '';
                return name.includes(queryLower) ||
                    description.includes(queryLower) ||
                    category.includes(queryLower);
            });
            setProducts(filtered);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductClick = (productId: number) => {
        // Navigate to product details page instead of opening modal
        go(`/product/${productId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onSearchChange={onSearchChange} />

            <div className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-700 hover:text-amber-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Search Results</h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Search Results */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <SkeletonLoader key={index} type="card" />
                        ))}
                    </div>
                ) : hasSearched ? (
                    <>
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Found <span className="font-semibold text-amber-700">{products.length}</span> results for "{searchQuery}"
                            </p>
                        </div>

                        {products.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg">
                                <Search size={64} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600 text-lg mb-2">No products found</p>
                                <p className="text-gray-500 text-sm">Try searching with different keywords</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop: Grid View */}
                                <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {products.map((product) => {
                                        const imageUrl = getImageUrl(product.product_image);
                                        const isNew = isProductNew(product);
                                        const isBestSeller = isProductBestSeller(product);
                                        const badge = isNew ? 'new' : isBestSeller ? 'bestseller' : null;
                                        const displayPrice = product.selling_price || product.price;
                                        const oldPrice = product.price > product.selling_price ? product.price : undefined;

                                        return (
                                            <ProductCard
                                                key={product.product_id}
                                                id={product.product_id}
                                                name={product.name || product.title || 'Product'}
                                                price={displayPrice}
                                                image={imageUrl}
                                                category={product.Catagory?.name || 'Uncategorized'}
                                                inStock={product.quantity > 0}
                                                badge={badge}
                                                oldPrice={oldPrice}
                                                disableHover={true}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Mobile: List View */}
                                <div className="sm:hidden space-y-3">
                                    {products.map((product) => {
                                        const imageUrl = getImageUrl(product.product_image);
                                        const isNew = isProductNew(product);
                                        const isBestSeller = isProductBestSeller(product);
                                        const badge = isNew ? 'new' : isBestSeller ? 'bestseller' : null;

                                        return (
                                            <div
                                                key={product.product_id}
                                                onClick={() => handleProductClick(product.product_id)}
                                                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all flex flex-row gap-3 p-3"
                                            >
                                                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                    <img
                                                        src={imageUrl}
                                                        alt={product.name || 'Product'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image';
                                                        }}
                                                    />
                                                    {badge && (
                                                        <div className="absolute top-1 left-1 z-10">
                                                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${badge === 'new'
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-red-600 text-white'
                                                                }`}>
                                                                {badge === 'new' ? 'New' : 'Bestseller'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {(!product.quantity || product.quantity < 1) && (
                                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                                                Out of Stock
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-amber-700 transition-colors">
                                                            {product.name || product.title || 'Product'}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 mb-1">
                                                            {product.Catagory?.name || 'Uncategorized'}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-bold text-amber-700">
                                                                ${product.selling_price || product.price}
                                                            </span>
                                                            {product.price > product.selling_price && (
                                                                <>
                                                                    <span className="text-xs text-gray-500 line-through">
                                                                        ${product.price}
                                                                    </span>
                                                                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[8px] font-semibold">
                                                                        Save {Math.round(((product.price - product.selling_price) / product.price) * 100)}%
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-semibold ${product.quantity && product.quantity >= 1
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                            }`}>
                                                            {product.quantity && product.quantity >= 1
                                                                ? 'In Stock'
                                                                : 'Out of Stock'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg">
                        <Search size={64} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 text-lg mb-2">Start searching for products</p>
                        <p className="text-gray-500 text-sm">Use the search bar above to search for products</p>
                    </div>
                )}
            </div>

            {/* Product Details Modal */}
            {selectedProductId && (
                <ProductDetails
                    productId={selectedProductId}
                    onClose={() => setSelectedProductId(null)}
                />
            )}

            <Footer />
        </div>
    );
}