import { useState, useEffect } from 'react';
import { Star, Plus, BadgeCheck } from 'lucide-react';
import { productAPI } from '../../services/api';
import ReviewForm from './ReviewForm';
import { useAuth } from '../../context/AuthContext';

interface Review {
    id: number;
    user_name: string;
    review_title: string;
    review_text: string;
    review_rate: number;
    review_image?: string; // Changed from review_media to match backend
    createdAt: string;
    user_review_count?: number;
}

interface ProductReviewsProps {
    productId: number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
    const { user, isAuthenticated } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [visibleReviews, setVisibleReviews] = useState(5);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [productId]);

    const loadReviews = async () => {
        try {
            setLoading(true);
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
                setReviews(sorted);
            } else {
                setReviews([]);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmitted = () => {
        setShowReviewForm(false);
        loadReviews();
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

    const getRatingColor = (rate: number) =>
        rate <= 1 ? 'bg-red-600' : rate <= 3 ? 'bg-yellow-500' : 'bg-green-600';

    const mediaSource = (media?: string) =>
        media
            ? media.startsWith('http')
                ? media
                : `${import.meta.env.VITE_SERVER_URL}/${media}`
            : '';

    if (loading) {
        return (
            <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Customer Reviews ({reviews.length})
                </h3>

                {isAuthenticated && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                        <Plus size={16} /> Write Review
                    </button>
                )}
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

            {showReviewForm && (
                <div className="mb-6">
                    <ReviewForm
                        productId={productId}
                        userEmail={user?.email ?? ''}
                        onReviewSubmitted={handleReviewSubmitted}
                        onCancel={() => setShowReviewForm(false)}
                    />
                </div>
            )}

            {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No reviews yet. Be the first to review this product!
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {reviews.slice(0, visibleReviews).map((review) => (
                            <div key={review.id} className="border p-4 rounded-lg shadow-sm bg-white">
                                {/* Rating */}
                                <div
                                    className={`flex items-center text-white px-2 py-1 rounded-md w-fit mb-3 ${getRatingColor(
                                        review.review_rate
                                    )}`}
                                >
                                    <span className="mr-1 font-semibold">{review.review_rate}</span>
                                    <Star size={15} className="fill-current text-white" />
                                </div>

                                {/* Media (Image) */}
                                {review.review_image && (
                                    <img
                                        className="w-40 h-40 rounded-md border mb-3 object-cover"
                                        src={mediaSource(review.review_image)}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                        }}
                                    />
                                )}


                                {/* Title + Text */}
                                <h4 className="font-semibold text-gray-800 mb-1">{review.review_title}</h4>
                                <p className="text-gray-700 mb-3">{review.review_text}</p>

                                {/* Footer */}
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="font-medium">{review.user_name}</span>

                                    {review.user_review_count && review.user_review_count >= 10 && (
                                        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-[2px] text-xs rounded-md">
                                            <BadgeCheck size={13} /> Certified Buyer
                                        </span>
                                    )}

                                    <span>•</span>
                                    <span>{formatDate(review.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SHOW MORE BUTTON */}
                    {visibleReviews < reviews.length && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setVisibleReviews((prev) => prev + 5)}
                                className="px-4 py-2 text-sm font-medium text-amber-700 border border-amber-700 rounded-lg hover:bg-amber-700 hover:text-white transition"
                            >
                                Show More Reviews
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}