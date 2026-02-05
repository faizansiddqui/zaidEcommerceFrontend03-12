import { useEffect, useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { ArrowLeft, Heart, X } from 'lucide-react';
import ProductCard from '../components/Product/ProductCard';
// import { useCart } from '../context/CartContext';
import { useNavigation } from "../utils/navigation";
import { Product, getImageUrl } from '../utils/productUtils';
import { useAuthProtection } from '../utils/authProtection';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { productAPI } from '../services/api';

type WishlistProduct = Product & {
    review_rate?: number;
    averageRating?: number;
    quantity?: number;
};

export default function WishlistPage() {
    const { go } = useNavigation();
    const { isAuthenticated } = useAuth();

    useAuthProtection(); // Protect this route
    const { wishlistItems, removeFromWishlist } = useWishlist();
    // const { addToCart } = useCart();
    const [liveStock, setLiveStock] = useState<Record<number, number | undefined>>({});

    useEffect(() => {
        let cancelled = false;

        const refreshStock = async () => {
            try {
                const results = await Promise.all(wishlistItems.map(async (item) => {
                    try {
                        const response = await productAPI.getProductById(item.product_id);
                        const productData = response?.data?.data;
                        if (Array.isArray(productData) && productData[0]) {
                            const quantity = productData[0].quantity;
                            return { id: item.product_id, quantity: typeof quantity === 'number' ? quantity : undefined };
                        }
                    } catch (error) {
                        console.error(`Failed to refresh stock for product ${item.product_id}:`, error);
                    }
                    return null;
                }));

                if (!cancelled) {
                    const updated: Record<number, number | undefined> = {};
                    results.forEach((entry) => {
                        if (entry) {
                            updated[entry.id] = entry.quantity;
                        }
                    });
                    setLiveStock(updated);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to refresh wishlist stock:', error);
                }
            }
        };

        if (wishlistItems.length > 0) {
            refreshStock();
        } else {
            setLiveStock({});
        }

        return () => {
            cancelled = true;
        };
    }, [wishlistItems]);

    // Handle login button click - save current path before redirecting
    const handleLoginClick = () => {
        // Save the current path to redirect back after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
        go('/log');
    };

    // Show login message if user is not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex flex-1 items-center justify-center px-4 py-16">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
                        <p className="text-gray-600 mb-6">You need to be logged in to view your wishlist.</p>
                        <button
                            onClick={handleLoginClick}
                            className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 rounded-lg font-semibold transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const handleRemoveFromWishlist = async (productId: number) => {
        await removeFromWishlist(productId);
    };

    // const handleAddToCart = async (product: WishlistProduct) => {
    //     try {
    //         const resolvedImage = getImageUrl(
    //             typeof product.product_image === 'string'
    //                 ? product.product_image
    //                 : Array.isArray(product.product_image)
    //                     ? product.product_image[0]
    //                     : Object.values(product.product_image || {})[0] || ''
    //         );

    //         await addToCart(product.product_id, {
    //             name: product.name,
    //             price: product.selling_price ?? product.price,
    //             image: resolvedImage
    //         });
    //         // Optionally remove from wishlist after adding to cart
    //         // await removeFromWishlist(product.product_id);
    //     } catch (error) {
    //         console.error('Failed to add to cart:', error);
    //     }
    // };

    const handleBack = () => {
        go('/profile');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-amber-700 transition-colors mb-8"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Profile</span>
                    </button>

                    <div className="flex items-center gap-3 mb-8">
                        <Heart className="text-amber-700" size={32} />
                        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                    </div>

                    {wishlistItems.length === 0 ? (
                        <div className="rounded-xl p-8 text-center">
                            <Heart size={48} className="text-gray-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                            <p className="text-gray-600 mb-6">Start adding items you love to your wishlist</p>
                            <button
                                onClick={() => go('/')}
                                className="bg-amber-700 hover:bg-amber-800 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {wishlistItems.map((item) => {
                                const product = item as WishlistProduct;
                                const resolvedImage = getImageUrl(
                                    typeof product.product_image === 'string'
                                        ? product.product_image
                                        : Array.isArray(product.product_image)
                                            ? product.product_image[0]
                                            : Object.values(product.product_image || {})[0] || ''
                                );

                                const liveQuantity = liveStock[product.product_id];
                                const quantityValue = liveQuantity ?? (typeof product.quantity === 'number' ? product.quantity : undefined);
                                const isInStock = quantityValue === undefined ? true : quantityValue > 0;
                                const ratingValue = product.review_rate ?? product.averageRating ?? 0;

                                return (
                                    <div key={product.product_id} className="overflow-hidden relative flex flex-col">
                                        <button
                                            onClick={() => handleRemoveFromWishlist(product.product_id)}
                                            className="absolute top-4 left-4 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors z-10"
                                        >
                                            <X size={20} className="text-gray-600" />
                                        </button>

                                        <ProductCard
                                            id={product.product_id}
                                            name={product.name}
                                            price={product.selling_price ?? product.price}
                                            oldPrice={product.price}
                                            image={resolvedImage}
                                            category={product.Catagory?.name || 'Uncategorized'}
                                            inStock={isInStock}
                                            quantity={quantityValue}
                                            averageRating={ratingValue}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
