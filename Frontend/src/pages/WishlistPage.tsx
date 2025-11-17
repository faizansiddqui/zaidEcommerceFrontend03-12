import { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Trash2, ShoppingCart } from 'lucide-react';
import { userAPI } from '../services/api';
import { useCart } from '../context/CartContext';

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistPageProps {
  onBack?: () => void;
}

export default function WishlistPage({ onBack }: WishlistPageProps) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await userAPI.getWishlist();
      setWishlist(response.data.wishlist || []);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch wishlist:', error);
      const errorMessage = error.message || 'Failed to fetch wishlist. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await userAPI.removeFromWishlist(productId);
      setWishlist(wishlist.filter((item) => item.id !== productId));
    } catch (error: any) {
      console.error('Failed to remove from wishlist:', error);
      alert(error.message || 'Failed to remove item from wishlist. Please try again.');
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    addToCart(item.id, 1);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
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
          <span className="font-medium">Back</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl shadow-md p-8 text-center">
            <Heart size={80} className="mx-auto text-red-300 mb-6" />
            <h2 className="text-2xl font-bold text-red-900 mb-4">Error Loading Wishlist</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={fetchWishlist}
              className="bg-red-700 hover:bg-red-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Heart size={80} className="mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">
              Start adding items you love to your wishlist.
            </p>
            <button
              onClick={handleBack}
              className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                  <p className="text-2xl font-bold text-amber-700 mb-4">${item.price}</p>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

