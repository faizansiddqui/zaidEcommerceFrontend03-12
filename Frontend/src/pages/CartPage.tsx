import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import { useNavigation } from "../utils/navigation";
import { useAuth } from '../context/AuthContext';

interface CartPageProps {
    onBack?: () => void;
}

export default function CartPage({ onBack }: CartPageProps) {
    const { go } = useNavigation();
    const { isAuthenticated } = useAuth();

    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        buyNow,
    } = useCart();
    const [productStocks, setProductStocks] = useState<Record<number, number>>({});

    // Fetch stock information for cart items
    useEffect(() => {
        // Only fetch if user is authenticated
        if (!isAuthenticated) return;

        const fetchStocks = async () => {
            const stocks: Record<number, number> = {};

            for (const item of cartItems) {
                try {
                    const response = await productAPI.getProductById(item.id);
                    if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
                        const product = response.data.data[0];
                        stocks[item.id] = product.quantity || 0;
                    } else {
                        stocks[item.id] = 0;
                    }
                } catch (error) {
                    console.error(`Failed to fetch stock for product ${item.id}:`, error);
                    stocks[item.id] = item.stock || 0;
                }
            }

            setProductStocks(stocks);

            // Auto-adjust quantities and remove out-of-stock items
            for (const item of cartItems) {
                const availableStock = stocks[item.id] ?? item.stock ?? 0;
                if (availableStock < 1) {
                    // Remove out-of-stock items
                    removeFromCart(item.id);
                } else if (item.quantity > availableStock) {
                    // Adjust quantity to available stock
                    updateQuantity(item.id, availableStock);
                }
            }

        };

        if (cartItems.length > 0) {
            fetchStocks();
        }
    }, [cartItems, removeFromCart, updateQuantity, isAuthenticated]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            go('/');
        }
    };

    // Handle login button click - save current path before redirecting
    const handleLoginClick = () => {
        // Save the current path to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('redirectAfterLogin', currentPath);
        go('/log');
    };

    // Show login message if user is not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
                    <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
                    <button
                        onClick={handleLoginClick}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-amber-700 transition-colors mb-8"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Continue Shopping</span>
                    </button>

                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                            <p className="text-gray-600 mb-8">
                                Looks like you haven't added anything to your cart yet.
                            </p>
                            <button
                                onClick={handleBack}
                                className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Start Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-amber-700 transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Continue Shopping</span>
                </button>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                    <span className="text-gray-600">
                        {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
                    </span>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-3 space-y-6">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex-shrink-0">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                    {item.name}
                                                </h3>
                                                <p className="text-2xl font-bold text-amber-700 mb-2">
                                                    ${item.price.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        // Buy now this specific item
                                                        buyNow(item.id);
                                                        // Navigate to checkout with state
                                                        go('/checkout', { state: { buyNowItemId: item.id } });
                                                    }}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    Buy Now
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {productStocks[item.id] !== undefined && (
                                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${productStocks[item.id] >= 1
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {productStocks[item.id] >= 1
                                                    ? `In Stock`
                                                    : 'Out of Stock'
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center border border-gray-300 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                    disabled={item.quantity <= 1}
                                                    className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="px-6 py-2 font-semibold min-w-[3rem] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const maxStock = productStocks[item.id] ?? item.stock ?? 10;
                                                        updateQuantity(item.id, Math.min(maxStock, item.quantity + 1));
                                                    }}
                                                    disabled={productStocks[item.id] !== undefined && item.quantity >= productStocks[item.id]}
                                                    className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            {(productStocks[item.id] !== undefined && productStocks[item.id] < 1) && (
                                                <p className="text-xs text-red-600">Out of Stock</p>
                                            )}
                                            {(productStocks[item.id] !== undefined && productStocks[item.id] >= 1 && item.quantity > productStocks[item.id]) && (
                                                <p className="text-xs text-orange-600">Only {productStocks[item.id]} available</p>
                                            )}
                                        </div>

                                        <div className="flex items-center">
                                            <span className="text-xl font-bold text-gray-900">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={clearCart}
                            className="text-red-600 hover:text-red-700 font-medium transition-colors"
                        >
                            Clear Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}