import { useState } from 'react';
import { Star, Check } from 'lucide-react';

interface ProductSpecification {
    specification_id?: number;
    key?: string;
    value?: string;
}

interface ProductInfoProps {
    name: string;
    title?: string;
    description?: string;
    price: number;
    sellingPrice: number;
    specifications?: ProductSpecification[];
    quantity: number;
    // Added review-related props
    averageRating?: number;
    reviewCount?: number;
}

export default function ProductInfo({
    name,
    title,
    description,
    price,
    sellingPrice,
    specifications,
    quantity,
    // Destructure review-related props with defaults
    averageRating = 0,
    reviewCount = 0
}: ProductInfoProps) {
    // State for showing/hiding full description
    const [showFullDescription, setShowFullDescription] = useState(false);

    // Get full product name/title
    const fullProductName = name || title || 'Product';

    // Truncate description to 100 words
    const truncateDescription = (desc: string, wordLimit: number = 50) => {
        if (!desc) return '';
        const words = desc.split(' ');
        if (words.length <= wordLimit) return desc;
        return words.slice(0, wordLimit).join(' ') + '...';
    };

    const truncatedDescription = description ? truncateDescription(description) : '';
    const shouldTruncate = description && description.split(' ').length > 50;

    // Function to get rating background color
    const getRatingBgColor = (rate: number) => {
        if (rate <= 1) return 'bg-red-600';
        if (rate <= 3) return 'bg-yellow-500';
        return 'bg-green-600';
    };

    return (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
                    {fullProductName}
                </h1>
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                    {/* Unified Star Rating Display with color and background */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-md ${getRatingBgColor(averageRating)}`}>
                        <Star size={16} className="fill-current text-white" />
                        <span className="ml-1 text-white font-bold">{averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm sm:text-base text-gray-600">
                        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                </div>
                {description && (
                    <div className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                        {shouldTruncate ? (
                            <>
                                <p>
                                    {showFullDescription ? description : truncatedDescription}
                                </p>
                                <button
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                    className="text-amber-700 hover:text-amber-800 font-[1rem] mt-2"
                                >
                                    {showFullDescription ? 'Show Less' : 'Show More'}
                                </button>
                            </>
                        ) : (
                            <p>{description}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="border-t border-b border-gray-200 py-4 sm:py-5 lg:py-6">
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 lg:gap-4">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-700">
                        ${sellingPrice || price}
                    </span>
                    {price > sellingPrice && (
                        <>
                            <span className="text-base sm:text-lg lg:text-xl text-gray-500 line-through">
                                ${price}
                            </span>
                            <span className="bg-red-100 text-red-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                                Save {Math.round((1 - sellingPrice / price) * 100)}%
                            </span>
                        </>
                    )}
                </div>
                <p className="text-sm sm:text-base text-amber-600 font-medium mt-2">
                    Free Shipping
                </p>
            </div>

            {(() => {
                const specs = specifications || [];

                if (specs.length > 0) {
                    return (
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Specifications</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    {specs.map((spec, index) => (
                                        <div key={index} className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                                            <span className="text-xs sm:text-sm text-gray-600 block mb-1">{spec.key || 'Specification'}</span>
                                            <p className="text-sm sm:text-base font-semibold">{spec.value || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            <div className={`${quantity > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-lg p-3 sm:p-4`}>
                <div className={`flex items-center gap-2 ${quantity > 0 ? 'text-green-800' : 'text-red-800'}`}>
                    <Check size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-sm sm:text-base font-semibold">
                        {quantity > 0
                            ? `In Stock - Ships within 2-3 business days`
                            : 'Out of Stock'
                        }
                    </span>
                </div>
            </div>

            {/* Bulk Order Contact Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <a
                    href="https://wa.me/917652087193?text=Hi%20Abdulla%20Islamic%20Store%2C%20I%20came%20across%20your%20website%20and%20would%20like%20to%20discuss%20about%20products."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm sm:text-base text-amber-800 font-medium hover:text-amber-900 hover:underline"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-green-600"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>For bulk order contact on whatsapp</span>
                </a>
            </div>
        </div>
    );
}