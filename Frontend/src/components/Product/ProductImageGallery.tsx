

import { isVideoUrl } from '../../utils/mediaUtils';
import VideoPlayer from './VideoPlayer';

interface ProductImageGalleryProps {
    images: string[];
    selectedImage: number;
    onImageSelect: (index: number) => void;
    productName: string;
    onImageClick?: (index: number) => void; // Optional callback for fullscreen view
}

export default function ProductImageGallery({
    images,
    selectedImage,
    onImageSelect,
    productName,
    onImageClick
}: ProductImageGalleryProps) {
    const mainImage = images[selectedImage] || images[0] || '';

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Main media display */}
            <div
                className="relative aspect-square mute rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => onImageClick && onImageClick(selectedImage)}
            >
                {isVideoUrl(mainImage) ? (
                    <VideoPlayer
                        src={mainImage}
                        className="w-full h-full mute object-cover"
                        disableOverlayClick={false}
                    />
                ) : (
                    <img
                        src={mainImage}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500?text=No+Image';
                        }}
                    />
                )}
                {/* Fullscreen indicator */}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                    Click to view fullscreen
                </div>
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-5 md:grid-cols-4 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                    {images.map((media, index) => (
                        <button
                            key={index}
                            onClick={() => onImageSelect(index)}
                            className={`aspect-square rounded-lg border border-gray-900 sm:rounded-xl overflow-hidden transition-all ${selectedImage === index
                                ? 'ring-2 sm:ring-3 lg:ring-4 ring-amber-600 scale-105'
                                : 'hover:opacity-75'
                                }`}
                        >
                            {isVideoUrl(media) ? (
                                <div className="w-full h-full relative bg-gray-100 flex items-center justify-center">
                                    <VideoPlayer
                                        src={media}
                                        className="w-full h-full object-cover"
                                        disableOverlayClick={true}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={media}
                                    alt={`${productName} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

