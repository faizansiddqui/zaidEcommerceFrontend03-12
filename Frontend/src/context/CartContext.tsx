import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// @ts-expect-error - productDetails.js is a JavaScript file
import { products } from '../productDetails';
import { userAPI } from '../services/api';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    stock?: number; // Available stock quantity
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (productId: number, quantity?: number, productData?: { name: string; price: number; image: string; stock?: number }) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
    saveCartToLocalStorage: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load cart from backend or localStorage on mount
    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            // Try to load from backend first
            const response = await userAPI.getCart();
            if (response.data && response.data.cartItems) {
                setCartItems(response.data.cartItems);
                setIsLoading(false);
                return;
            }
        } catch (error: any) {
            // Check if it's a 404 (endpoint doesn't exist)
            if (error.response?.status === 404) {
                console.warn('Cart endpoint /user/cart not available. Using localStorage only.');
            } else if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
                console.warn('Network error loading cart. Using localStorage.');
            } else {
                console.warn('Failed to load cart from backend. Using localStorage.');
            }
        }

        // Fallback to localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
            }
        }
        setIsLoading(false);
    };

    // Save cart to backend and localStorage whenever it changes
    useEffect(() => {
        if (!isLoading && cartItems.length >= 0) {
            // Save to localStorage immediately
            localStorage.setItem('cart', JSON.stringify(cartItems));
            
            // Try to save to backend (async, don't wait)
            // Note: /user/cart endpoint may not be available
            userAPI.saveCart(cartItems).catch((error: any) => {
                // Only log if it's not a 404 (endpoint doesn't exist)
                if (error.response?.status !== 404) {
                    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
                        console.warn('Network error saving cart. Cart saved to localStorage only.');
                    } else {
                        console.warn('Failed to save cart to backend. Cart saved to localStorage only.');
                    }
                }
            });
        }
    }, [cartItems, isLoading]);

    const addToCart = (productId: number, quantity: number = 1, productData?: { name: string; price: number; image: string; stock?: number }) => {
        // If productData is provided (from backend), use it directly
        if (productData) {
            setCartItems((prevItems) => {
                const existingItem = prevItems.find((item) => item.id === productId);
                if (existingItem) {
                    return prevItems.map((item) =>
                        item.id === productId
                            ? { ...item, quantity: item.quantity + quantity, stock: productData.stock }
                            : item
                    );
                } else {
                    return [
                        ...prevItems,
                        {
                            id: productId,
                            name: productData.name,
                            price: productData.price,
                            image: productData.image,
                            quantity: quantity,
                            stock: productData.stock,
                        },
                    ];
                }
            });
            return;
        }

        // Fallback to local products array
        const product = products.find((p: { id: number }) => p.id === productId);
        if (!product) {
            console.warn(`Product with id ${productId} not found in local products`);
            return;
        }

        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === productId);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [
                    ...prevItems,
                    {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        quantity: quantity,
                    },
                ];
            }
        });
    };

    const removeFromCart = (productId: number) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const saveCartToLocalStorage = () => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getTotalItems,
                saveCartToLocalStorage,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}