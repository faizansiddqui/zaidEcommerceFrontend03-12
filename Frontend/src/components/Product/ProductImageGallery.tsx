

interface ProductImageGalleryProps {
    images: string[];
    selectedImage: number;
    onImageSelect: (index: number) => void;
    productName: string;
}

export default function ProductImageGallery({
    images,
    selectedImage,
    onImageSelect,
    productName
}: ProductImageGalleryProps) {
    const mainImage = images[selectedImage] || images[0] || '';

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="relative aspect-square rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden bg-gray-100">
                <img
                    src={mainImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500?text=No+Image';
                    }}
                />
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => onImageSelect(index)}
                            className={`aspect-square rounded-lg sm:rounded-xl overflow-hidden transition-all ${selectedImage === index
                                    ? 'ring-2 sm:ring-3 lg:ring-4 ring-amber-600 scale-105'
                                    : 'hover:opacity-75'
                                }`}
                        >
                            <img
                                src={image}
                                alt={`${productName} ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

