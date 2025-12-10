import { ShoppingCart, ArrowRight, CreditCard } from 'lucide-react';

interface ProductActionsProps {
    quantity: number;
    onAddToCart: () => void;
    onBuyNow: () => void;
    addedToCart: boolean;
    onGoToCart: () => void;
}

export default function ProductActions({
    quantity,
    onAddToCart,
    onBuyNow,
    addedToCart,
    onGoToCart
}: ProductActionsProps) {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4">
            {addedToCart ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                    <button
                        onClick={onGoToCart}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 sm:py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                        Go to Cart
                        <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    {/* Show Buy Now button only on mobile devices (hidden on tablet and larger screens) */}
                    <button
                        onClick={onBuyNow}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base md:hidden"
                    >
                        <CreditCard size={18} className="sm:w-5 sm:h-5" />
                        Buy Now
                    </button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                    <button
                        onClick={onAddToCart}
                        disabled={quantity === 0}
                        className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                        <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                        {quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    {/* Show Buy Now button only on mobile devices (hidden on tablet and larger screens) */}
                    <button
                        onClick={onBuyNow}
                        disabled={quantity === 0}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base md:hidden"
                    >
                        <CreditCard size={18} className="sm:w-5 sm:h-5" />
                        {quantity === 0 ? 'Out of Stock' : 'Buy Now'}
                    </button>
                </div>
            )}
        </div>
    );
}