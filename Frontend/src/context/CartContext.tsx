import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode,
} from "react";
// @ts-expect-error - productDetails.js is a JavaScript file
import { products } from "../productDetails";
import { userAPI } from "../services/api";
import { useAuth } from "./AuthContext";

export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    stock?: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (
        productId: number,
        quantity?: number,
        productData?: {
            name: string;
            price: number;
            image: string;
            stock?: number;
        }
    ) => void;
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
    const { isAuthenticated } = useAuth();

    // Prevent saving to localStorage during first load
    const firstLoadRef = useRef(true);

    useEffect(() => {
        loadCart();
    }, [isAuthenticated]);

    const loadCart = async () => {
        // If user is not authenticated, don't attempt to load from backend
        if (!isAuthenticated) {
            // Clear any existing cart items
            setCartItems([]);
            setIsLoading(false);
            return;
        }

        try {
            const response = await userAPI.getCart();
            if (response.data && response.data.cartItems) {
                setCartItems(response.data.cartItems);
                setIsLoading(false);
                return;
            }
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: unknown }; code?: string; message?: string };
                if (axiosError.response?.status === 404) {
                    console.warn("Cart endpoint /user/cart not available.");
                } else if (axiosError.response?.status === 403) {
                    console.warn("Authentication required for cart.");
                } else if (axiosError.code === "ERR_NETWORK" || axiosError.message?.includes("CORS")) {
                    console.warn("Network error loading cart.");
                } else {
                    console.warn("Failed to load cart from backend.");
                }
            } else {
                console.warn("Failed to load cart from backend.");
            }
        }

        // Don't load from localStorage when user is not authenticated
        // Clear any existing cart items
        setCartItems([]);
        setIsLoading(false);
    };

    // Save cart AFTER initial load
    useEffect(() => {
        if (isLoading) return;

        // Skip saving on first render
        if (firstLoadRef.current) {
            firstLoadRef.current = false;
            return;
        }

        // Only save to backend when user is authenticated
        if (isAuthenticated) {
            // Save to backend (if exists)
            userAPI.saveCart(cartItems as unknown as Record<string, unknown>[]).catch((error: unknown) => {
                if (typeof error === 'object' && error !== null && 'response' in error) {
                    const axiosError = error as { response?: { status?: number }; code?: string; message?: string };
                    if (axiosError.response?.status !== 404) {
                        if (axiosError.code === "ERR_NETWORK" || axiosError.message?.includes("CORS")) {
                            console.warn("Network error saving cart.");
                        } else {
                            console.warn("Failed to save cart to backend.");
                        }
                    }
                } else {
                    console.warn("Failed to save cart to backend.");
                }
            });
        }
        // Don't save to localStorage when user is not authenticated
    }, [cartItems, isLoading, isAuthenticated]);

    const addToCart = (
        productId: number,
        quantity: number = 1,
        productData?: { name: string; price: number; image: string; stock?: number }
    ) => {
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
        // Don't save to localStorage when user is not authenticated
        if (isAuthenticated) {
            // This function is kept for backward compatibility but should not be used
            // All cart persistence should happen through the backend
        }
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
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
