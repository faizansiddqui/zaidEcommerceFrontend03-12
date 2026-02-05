import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';
import { productCache } from '../services/productCache';
import ProductImageGallery from '../components/Product/ProductImageGallery';
import ProductInfo from '../components/Product/ProductInfo';
import ProductActions from '../components/Product/ProductActions';
import ProductReviews from '../components/Product/ProductReviews';
import FullscreenGalleryModal from '../components/Product/FullscreenGalleryModal';
import { useNavigation } from "../utils/navigation";
import { Product } from '../utils/productUtils';
import ProductCard from '../components/Product/ProductCard';
import { getCategoryById } from '../data/categories';
import { getSortedMediaArray } from '../utils/mediaSortUtils';
import SkeletonLoader from '../components/UI/SkeletonLoader';
// Added imports for navbar and footer
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

interface ProductSpecification {
    specification_id?: number;
    key?: string;
    value?: string;
}

interface ProductData {
    product_id: number;
    name: string;
    title?: string;
    price: number;
    selling_price: number;
    product_image: string | string[] | { [key: string]: string };
    product_video?: string; // Add video support
    quantity: number;
    description?: string;
    ProductSpecification?: ProductSpecification[];
    ProductSpecifications?: ProductSpecification[]; // Sequelize might return plural
    catagory_id?: number; // Product has category ID
}

// Interface for product data from category API
interface CategoryProductData {
    product_id: number;
    name: string;
    title?: string;
    price: number;
    selling_price: number;
    product_image: string | string[] | { [key: string]: string };
    quantity: number;
    Catagory?: {
        id: number;
        name: string;
    };
}

interface ProductDetailsPageProps {
    productId: number;
    onBack?: () => void;
}

// Define Review interface locally since we need it for calculating average rating
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

export default function ProductDetailsPage({ productId, onBack }: ProductDetailsPageProps) {
    const [product, setProduct] = useState<ProductData | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<CategoryProductData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRelated, setIsLoadingRelated] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const [averageRating, setAverageRating] = useState(0); // Add state for average rating
    const [reviewCount, setReviewCount] = useState(0); // Add state for review count
    const [isContentVisible, setIsContentVisible] = useState(false); // For smooth transition
    const [isFullscreenGalleryOpen, setIsFullscreenGalleryOpen] = useState(false);
    const [fullscreenGalleryIndex, setFullscreenGalleryIndex] = useState(0);
    const { cartItems, addToCart, isInCart, buyNow } = useCart(); // Add cartItems to the destructuring
    const { go } = useNavigation();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        loadProduct();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    // Add effect to update addedToCart when cart changes
    useEffect(() => {
        if (product) {
            setAddedToCart(isInCart(product.product_id));
        }
    }, [cartItems, product, isInCart]);

    // Add effect for smooth content transition
    useEffect(() => {
        if (!isLoading && product) {
            // Small delay to ensure smooth transition
            const timer = setTimeout(() => {
                setIsContentVisible(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setIsContentVisible(false);
        }
    }, [isLoading, product]);

    const loadProduct = async () => {
        // Check cache first for main product content only
        const cachedData = productCache.getCachedProductDetails(productId);

        if (cachedData) {
            // Load main product from cache
            setProduct(cachedData.product);
            setIsLoading(false);

            // But always load reviews and related products fresh
            if (cachedData.product.catagory_id) {
                loadRelatedProducts(cachedData.product.catagory_id, cachedData.product.product_id);
            }
            loadProductReviews(cachedData.product.product_id);

            // Small delay for smooth transition
            setTimeout(() => {
                setIsContentVisible(true);
            }, 100);
            return;
        }

        // If not in cache, fetch from API
        setIsLoading(true);
        setError('');
        try {
            const response = await productAPI.getProductById(productId);

            if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
                const productData = response.data.data[0];
                setProduct(productData);

                // Cache only the main product content
                productCache.setCachedProductDetails(productId, productData);

                // Always load reviews and related products fresh
                if (productData.catagory_id) {
                    loadRelatedProducts(productData.catagory_id, productData.product_id);
                }
                loadProductReviews(productData.product_id);
            } else {
                setError('Product not found');
            }
        } catch (error: unknown) {
            console.error('❌ Error loading product:', error);
            const err = error as {
                response?: {
                    status?: number;
                    data?: { message?: string };
                };
                message?: string;
            };
            setError(err.response?.data?.message || err.message || 'Failed to load product');
        } finally {
            setIsLoading(false);
            setIsContentVisible(false); // Reset visibility when loading starts
        }
    };

    const loadProductReviews = async (productId: number) => {
        try {
            const response = await productAPI.getProductReviews(productId);
            const list =
                response?.data?.reviews ||
                response?.data?.data ||
                [];

            if (Array.isArray(list)) {
                const sorted = list.sort(
                    (a: Review, b: Review) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setReviewCount(sorted.length);

                // Calculate average rating
                if (sorted.length > 0) {
                    const totalRating = sorted.reduce((sum, review) => sum + review.review_rate, 0);
                    setAverageRating(totalRating / sorted.length);
                } else {
                    setAverageRating(0);
                }
            } else {
                setReviewCount(0);
                setAverageRating(0);
            }
        } catch (err) {
            console.error('Failed to load product reviews:', err);
            setReviewCount(0);
            setAverageRating(0);
        }
    };

    const loadRelatedProducts = async (categoryId: number, currentProductId: number) => {
        setIsLoadingRelated(true);
        try {
            // Get category name from hardcoded categories
            const category = getCategoryById(categoryId);

            if (category) {
                // Now fetch related products by category name
                const response = await productAPI.getProductByCategory(category.name);

                if (response.data.status === 'ok' && response.data.data) {
                    const categoryData = response.data.data;
                    if (categoryData && categoryData.Products && Array.isArray(categoryData.Products)) {
                        // Filter out the current product and limit to 4 related products
                        const related = categoryData.Products
                            .filter((p: CategoryProductData) => p.product_id !== currentProductId)
                            .slice(0, 4);
                        setRelatedProducts(related);
                    } else {
                        setRelatedProducts([]);
                    }
                } else {
                    setRelatedProducts([]);
                }
            } else {
                setRelatedProducts([]);
            }
        } catch (error: unknown) {
            console.error('❌ Error loading related products:', error);
            setRelatedProducts([]);
        } finally {
            setIsLoadingRelated(false);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            // Pass product data to addToCart
            addToCart(product.product_id, {
                name: product.name || product.title || 'Product',
                price: product.selling_price || product.price,
                image: Array.isArray(product.product_image)
                    ? product.product_image[0]
                    : typeof product.product_image === 'string'
                        ? product.product_image
                        : Object.values(product.product_image)[0] || ''
            });
            setAddedToCart(true);
        }
    };

    const handleGoToCart = () => {
        go('/cart');
    };

    const handleBuyNow = () => {
        if (product) {
            const productInfo = {
                name: product.name || product.title || 'Product',
                price: product.selling_price || product.price,
                image: Array.isArray(product.product_image)
                    ? product.product_image[0]
                    : typeof product.product_image === 'string'
                        ? product.product_image
                        : Object.values(product.product_image)[0] || ''
            };

            if (!isAuthenticated) {
                buyNow(product.product_id, productInfo);
                return;
            }
            // Add to cart and redirect to checkout
            addToCart(product.product_id, productInfo);
            // Mark this as a buy-now checkout and redirect
            buyNow(product.product_id);
            go('/checkout', { state: { buyNowItemId: product.product_id } });
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            go('/');
        }
    };

    const handleImageClick = (index: number) => {
        setFullscreenGalleryIndex(index);
        setIsFullscreenGalleryOpen(true);
    };

    const closeFullscreenGallery = () => {
        setIsFullscreenGalleryOpen(false);
    };

    if (isLoading) {
        return (
            // Added navbar and footer to loading state
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Skeleton for product details */}
                    <div className="rounded-xl overflow-hidden">
                        <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-8">
                            {/* Image gallery skeleton */}
                            <div className="space-y-4">
                                <SkeletonLoader type="card" height="600px" className="rounded-lg" />
                            </div>
                            {/* Product info skeleton */}
                            <div className="space-y-4">
                                <SkeletonLoader type="text" lines={1} />
                                <SkeletonLoader type="text" width="60%" />
                                <SkeletonLoader type="text" lines={1} />
                                <div className="space-y-2">
                                    <SkeletonLoader type="text" width="40%" />
                                    <SkeletonLoader type="text" width="30%" />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <SkeletonLoader type="button" width="120px" />
                                    <SkeletonLoader type="button" width="100px" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            // Added navbar and footer to error state
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="rounded-xl shadow-md p-8 text-center">
                        <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
                        <button
                            onClick={handleBack}
                            className="bg-amber-700 hover:bg-amber-800 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
                        >
                            Back to Products
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        // Added navbar and footer to main render
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-4 py-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-amber-700 transition-colors mb-6"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Back to Products</span>
                </button>

                <div className={`rounded-xl overflow-hidden transition-all duration-500 ease-in-out ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                    <div className="grid lg:grid-cols-2 gap-8 p-2 lg:p-3">
                        <ProductImageGallery
                            images={product ? getSortedMediaArray(product.product_image) : []}
                            selectedImage={selectedImage}
                            onImageSelect={setSelectedImage}
                            productName={product.name || product.title || 'Product'}
                            onImageClick={handleImageClick}
                        />

                        <div className="space-y-6">
                            <ProductInfo
                                name={product.name || product.title || 'Product'}
                                title={product.title}
                                description={product.description}
                                price={product.price}
                                sellingPrice={product.selling_price}
                                specifications={product.ProductSpecification || product.ProductSpecifications || []}
                                quantity={product.quantity}
                                product={product as Product}
                                // Pass dynamic review data
                                averageRating={averageRating}
                                reviewCount={reviewCount}
                            />

                            <ProductActions
                                quantity={product.quantity}
                                onAddToCart={handleAddToCart}
                                onBuyNow={handleBuyNow}
                                addedToCart={addedToCart}
                                onGoToCart={handleGoToCart}
                            />

                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                <div className="mt-12 px-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
                        {/* <div className="w-16 h-1 bg-amber-600 rounded-full"></div> */}
                    </div>

                    {isLoadingRelated ? (
                        <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-500 ease-in-out ${!isLoadingRelated && relatedProducts.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            }`}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <SkeletonLoader key={i} type="card" />
                            ))}
                        </div>
                    ) : relatedProducts.length > 0 ? (
                        <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-500 ease-in-out ${!isLoadingRelated && relatedProducts.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            }`}>
                            {relatedProducts.map((relatedProduct) => {
                                // Handle different image formats
                                let imageUrl = '';
                                if (typeof relatedProduct.product_image === 'string') {
                                    imageUrl = relatedProduct.product_image;
                                } else if (Array.isArray(relatedProduct.product_image)) {
                                    imageUrl = relatedProduct.product_image[0] || '';
                                } else if (typeof relatedProduct.product_image === 'object') {
                                    const imageValues = Object.values(relatedProduct.product_image);
                                    imageUrl = imageValues[0] || '';
                                }

                                const displayPrice = relatedProduct.selling_price || relatedProduct.price;

                                return (
                                    <ProductCard
                                        key={relatedProduct.product_id}
                                        id={relatedProduct.product_id}
                                        name={relatedProduct.name || relatedProduct.title || 'Product'}
                                        price={displayPrice}
                                        image={imageUrl}
                                        category={relatedProduct.Catagory?.name || ''}
                                        inStock={relatedProduct.quantity > 0}
                                        disableHover={true}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-xl">
                            <p className="text-gray-500">No related products found in this category.</p>
                        </div>
                    )}
                </div>
                
                {/* Product Reviews Section */}
                <div className="mt-8 px-2">
                    <ProductReviews productId={product.product_id} />
                </div>

            </div>
            <Footer />

            {/* Fullscreen Gallery Modal */}
            {isFullscreenGalleryOpen && product && (
                <FullscreenGalleryModal
                    images={getSortedMediaArray(product.product_image)}
                    initialIndex={fullscreenGalleryIndex}
                    onClose={closeFullscreenGallery}
                    productName={product.name || product.title || 'Product'}
                />
            )}
        </div>
    );
}
