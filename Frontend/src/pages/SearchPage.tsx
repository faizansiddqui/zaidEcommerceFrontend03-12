import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { productAPI } from '../services/api';
import ProductCard from '../components/Product/ProductCard';
import ProductDetails from '../components/Product/ProductDetails';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import SearchSuggestions from '../components/Search/SearchSuggestions';
import { Product, getImageUrl, isProductNew, isProductBestSeller } from '../utils/productUtils';

interface SearchPageProps {
    onBack: () => void;
}

export default function SearchPage({ onBack }: SearchPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Load all products for suggestions
    useEffect(() => {
        const loadAllProducts = async () => {
            try {
                const response = await productAPI.getProducts();
                if (response.data.status && Array.isArray(response.data.products)) {
                    // Store for suggestions
                    setSuggestions(response.data.products);
                }
            } catch (error) {
                console.error('Error loading products for suggestions:', error);
            }
        };
        loadAllProducts();
    }, []);

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setProducts([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        setShowSuggestions(false);

        try {
            console.log('🔵 Searching for:', query);
            const response = await productAPI.searchProduct(query);
            console.log('🟢 Search results:', response.data);

            if (response.data.status && Array.isArray(response.data.products)) {
                setProducts(response.data.products);
            } else if (response.data.status && response.data.data && Array.isArray(response.data.data)) {
                setProducts(response.data.data);
            } else {
                // Fallback: filter from all products
                const queryLower = query.toLowerCase();
                const filtered = suggestions.filter((product) => {
                    const name = (product.name || product.title || '').toLowerCase();
                    const category = product.Catagory?.name?.toLowerCase() || '';
                    return name.includes(queryLower) || category.includes(queryLower);
                });
                setProducts(filtered);
            }
        } catch (error: unknown) {
            console.error('❌ Error searching products:', error);
            // Fallback: filter from all products
            const queryLower = query.toLowerCase();
            const filtered = suggestions.filter((product) => {
                const name = (product.name || product.title || '').toLowerCase();
                const category = product.Catagory?.name?.toLowerCase() || '';
                return name.includes(queryLower) || category.includes(queryLower);
            });
            setProducts(filtered);
        } finally {
            setIsLoading(false);
        }
    };

    // Get search query from URL hash
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#/search')) {
            const queryMatch = hash.match(/[?&]q=([^&]*)/);
            if (queryMatch) {
                const query = decodeURIComponent(queryMatch[1] || '');
                setSearchQuery(query);
                if (query.trim() && suggestions.length > 0) {
                    // Use setTimeout to ensure performSearch is available
                    setTimeout(() => {
                        performSearch(query);
                    }, 0);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [suggestions.length]);

    const getFilteredSuggestions = useMemo(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            return [];
        }
        const query = searchQuery.toLowerCase();
        return suggestions.filter((product) => {
            const name = (product.name || product.title || '').toLowerCase();
            const category = product.Catagory?.name?.toLowerCase() || '';
            return name.includes(query) || category.includes(query);
        }).slice(0, 10);
    }, [searchQuery, suggestions]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setShowSuggestions(value.trim().length >= 2);
        if (!value.trim()) {
            setHasSearched(false);
            setProducts([]);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
            performSearch(trimmedQuery);
            // Update URL
            window.location.hash = `#/search?q=${encodeURIComponent(trimmedQuery)}`;
        }
    };

    const handleSuggestionSelect = (productId: number) => {
        setSelectedProductId(productId);
        setShowSuggestions(false);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions]);

    const handleProductClick = (productId: number) => {
        setSelectedProductId(productId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

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
                        <h1 className="text-xl font-bold text-gray-900">Search Products</h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Search Bar */}
                <div className="mb-6" ref={searchContainerRef}>
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onFocus={() => setShowSuggestions(searchQuery.trim().length >= 2)}
                                placeholder="Search for products..."
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-700 transition-colors"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                        {showSuggestions && (
                            <SearchSuggestions
                                suggestions={getFilteredSuggestions}
                                onSelect={handleSuggestionSelect}
                                searchQuery={searchQuery}
                            />
                        )}
                    </form>
                </div>

                {/* Search Results */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
                        <span className="ml-3 text-gray-600">Searching...</span>
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
                                                onClick={() => handleProductClick(product.product_id)}
                                                badge={badge}
                                                oldPrice={oldPrice}
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
                                                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-xl flex flex-row gap-3 p-3"
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
                        <p className="text-gray-500 text-sm">Type a product name and press Enter to search</p>
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

