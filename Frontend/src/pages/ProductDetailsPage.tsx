import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import ProductImageGallery from '../components/Product/ProductImageGallery';
import ProductInfo from '../components/Product/ProductInfo';
import ProductActions from '../components/Product/ProductActions';
import ProductReviews from '../components/Product/ProductReviews';
import WishlistButton from '../components/Product/WishlistButton';
import { useNavigation } from "../utils/navigation";
import { Product } from '../utils/productUtils';
import ProductCard from '../components/Product/ProductCard';
import { getCategoryById } from '../data/categories';
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

export default function ProductDetailsPage({ productId, onBack }: ProductDetailsPageProps) {
    const [product, setProduct] = useState<ProductData | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<CategoryProductData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRelated, setIsLoadingRelated] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const { cartItems, addToCart, isInCart } = useCart(); // Add cartItems to the destructuring
    const { go } = useNavigation();

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

    const loadProduct = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await productAPI.getProductById(productId);

            if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
                const productData = response.data.data[0];
                setProduct(productData);

                // Load related products based on category
                if (productData.catagory_id) {
                    loadRelatedProducts(productData.catagory_id, productData.product_id);
                }
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

    const getImageArray = (productImage: string | string[] | { [key: string]: string } | undefined): string[] => {
        if (!productImage) return [];
        if (typeof productImage === 'string') {
            return [productImage];
        }
        if (Array.isArray(productImage)) {
            return productImage;
        }
        if (typeof productImage === 'object') {
            return Object.values(productImage);
        }
        return [];
    };

    const handleGoToCart = () => {
        go('/cart');
    };

    const handleBuyNow = () => {
        if (product) {
            // Add to cart and redirect to checkout
            addToCart(product.product_id, {
                name: product.name || product.title || 'Product',
                price: product.selling_price || product.price,
                image: Array.isArray(product.product_image)
                    ? product.product_image[0]
                    : typeof product.product_image === 'string'
                        ? product.product_image
                        : Object.values(product.product_image)[0] || ''
            });
            // Redirect to checkout page
            go('/checkout');
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            go('/');
        }
    };

    if (isLoading) {
        return (
            // Added navbar and footer to loading state
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
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
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
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

    const images = getImageArray(product.product_image);

    return (
        // Added navbar and footer to main render
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-amber-700 transition-colors mb-6"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Back to Products</span>
                </button>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-8">
                        <ProductImageGallery
                            images={images}
                            selectedImage={selectedImage}
                            onImageSelect={setSelectedImage}
                            productName={product.name || product.title || 'Product'}
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
                            />

                            {/* Wishlist Button */}
                            <div className="flex justify-end">
                                <WishlistButton
                                    product={product as Product}
                                    size="lg"
                                    showLabel={true}
                                />
                            </div>

                            <ProductActions
                                quantity={product.quantity}
                                selectedQuantity={1} // Always set to 1
                                onQuantityDecrease={() => { }} // Disable decrease
                                onQuantityIncrease={() => { }} // Disable increase
                                onAddToCart={handleAddToCart}
                                onBuyNow={handleBuyNow}
                                addedToCart={addedToCart}
                                onGoToCart={handleGoToCart}
                            />
                        </div>
                    </div>
                </div>

                {/* Product Reviews Section */}
                <div className="mt-8">
                    <ProductReviews productId={product.product_id} />
                </div>

                {/* Related Products Section */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
                        {/* <div className="w-16 h-1 bg-amber-600 rounded-full"></div> */}
                    </div>

                    {isLoadingRelated ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
                        </div>
                    ) : relatedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <p className="text-gray-500">No related products found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}