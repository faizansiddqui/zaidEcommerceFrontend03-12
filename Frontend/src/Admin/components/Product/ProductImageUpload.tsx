interface ProductImageUploadProps {
    productImages: File[];
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

export default function ProductImageUpload({ productImages, onImageChange, error }: ProductImageUploadProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Images <span className="text-red-500">*</span> (Max 5)
            </label>
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                required
            />
            {productImages.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">{productImages.length} image(s) selected</p>
            )}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}

