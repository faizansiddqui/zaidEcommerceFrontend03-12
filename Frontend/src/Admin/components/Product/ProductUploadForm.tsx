import { useState } from 'react';
import { adminAPI } from '../../../services/api';
import AlertMessage from '../Admin/AlertMessage';
import ProductFormFields from './ProductFormFields';
import ProductImageUpload from './ProductImageUpload';
import { getCategories, Category } from '../../../data/categories';

interface ProductFormData {
    name: string;
    title: string;
    price: string;
    selling_price: string;
    selling_price_link: string;
    quantity: string;
    sku: string;
    description: string;
    catagory: string;
    specification: string;
}

export default function ProductUploadForm() {
    const [productForm, setProductForm] = useState<ProductFormData>({
        name: '',
        title: '',
        price: '',
        selling_price: '',
        selling_price_link: '',
        quantity: '',
        sku: '',
        description: '',
        catagory: '',
        specification: '',
    });
    const [productImages, setProductImages] = useState<File[]>([]);
    const [productError, setProductError] = useState('');
    const [productSuccess, setProductSuccess] = useState('');
    const [isUploadingProduct, setIsUploadingProduct] = useState(false);

    // Load categories from centralized data file
    const hardcodedCategories: Category[] = getCategories();

    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 5) {
            setProductError('Maximum 5 images allowed');
            return;
        }
        setProductImages(files);
        setProductError('');
    };

    const handleFormChange = (field: keyof ProductFormData, value: string) => {
        setProductForm(prev => ({ ...prev, [field]: value }));
    };

    const handleUploadProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (productImages.length === 0) {
            setProductError('At least one image is required');
            return;
        }

        // Validate required fields (all except SKU)
        if (!productForm.name.trim()) {
            setProductError('Product name is required');
            return;
        }

        if (!productForm.title.trim()) {
            setProductError('Title is required');
            return;
        }

        if (!productForm.price || parseFloat(productForm.price.trim()) <= 0) {
            setProductError('Valid price is required');
            return;
        }

        if (!productForm.selling_price || parseFloat(productForm.selling_price.trim()) <= 0) {
            setProductError('Valid selling price is required');
            return;
        }

        // NEW: Validate selling price link is required
        if (!productForm.selling_price_link.trim()) {
            setProductError('Selling price link is required');
            return;
        }

        if (!productForm.quantity || parseInt(productForm.quantity.trim()) < 0) {
            setProductError('Valid quantity is required');
            return;
        }

        if (!productForm.catagory.trim()) {
            setProductError('Category is required');
            return;
        }

        if (!productForm.description.trim()) {
            setProductError('Description is required');
            return;
        }

        // Validate numeric fields
        const priceNum = parseFloat(productForm.price.trim());
        const sellingPriceNum = parseFloat(productForm.selling_price.trim());
        const quantityNum = parseInt(productForm.quantity.trim());

        if (isNaN(priceNum) || isNaN(sellingPriceNum) || isNaN(quantityNum)) {
            setProductError('Price, selling price, and quantity must be valid numbers');
            return;
        }

        if (quantityNum < 0) {
            setProductError('Quantity must be a valid positive number');
            return;
        }

        setIsUploadingProduct(true);
        setProductError('');
        setProductSuccess('');

        try {
            const formData = new FormData();

            // Add images
            productImages.forEach((image) => {
                formData.append('images', image);
            });

            // Add product data according to backend
            formData.append('name', productForm.name.trim());
            formData.append('title', productForm.title.trim());
            formData.append('price', priceNum.toString());
            formData.append('selling_price', sellingPriceNum.toString());
            if (productForm.selling_price_link.trim()) {
                formData.append('selling_price_link', productForm.selling_price_link.trim());
            } else {
                formData.append('selling_price_link', ''); // Send empty string if not provided
            }
            formData.append('quantity', quantityNum.toString());
            if (productForm.sku.trim()) {
                formData.append('sku', productForm.sku.trim());
            } else {
                formData.append('sku', ''); // Send empty string if not provided
            }
            formData.append('description', productForm.description || '');
            formData.append('catagory', productForm.catagory);

            // Add specification as JSON string if provided and valid
            if (productForm.specification.trim()) {
                try {
                    // Validate that it's proper JSON
                    const specs = JSON.parse(productForm.specification);
                    // Only send if it's a valid object with content
                    if (typeof specs === 'object' && specs !== null && Object.keys(specs).length > 0) {
                        formData.append('specification', JSON.stringify(specs));
                    }
                } catch (parseError) {
                    console.warn('⚠️ Invalid JSON in specification, skipping:', parseError);
                    // Don't fail the whole request if specs are invalid, just skip them
                }
            }

            await adminAPI.uploadProduct(formData);
            setProductSuccess('Product uploaded successfully!');

            // Reset form
            setProductForm({
                name: '',
                title: '',
                price: '',
                selling_price: '',
                selling_price_link: '',
                quantity: '',
                sku: '',
                description: '',
                catagory: '',
                specification: '',
            });
            setProductImages([]);
        } catch (error: unknown) {
            console.error('❌ Product upload failed - Full error:', error);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        status?: number;
                        data?: { message?: string; error?: string; err?: string;[key: string]: unknown };
                        statusText?: string;
                    };
                    message?: string;
                    code?: string;
                };

                console.error('❌ Axios Error Details:');
                console.error('  - Status:', axiosError.response?.status);
                console.error('  - Status Text:', axiosError.response?.statusText);
                console.error('  - Response Data:', axiosError.response?.data);
                console.error('  - Error Code:', axiosError.code);
                console.error('  - Error Message:', axiosError.message);

                // Get detailed error message from backend
                let errorMsg = '';
                if (axiosError.response?.data) {
                    const errorData = axiosError.response.data;
                    // Show the actual error message from backend
                    const backendError = errorData.error || errorData.err || errorData.message || errorData.Message;
                    errorMsg = (backendError || JSON.stringify(errorData)) as string;

                    // Provide helpful context for common errors
                    if (typeof backendError === 'string' && backendError.includes('invalid input syntax for type integer')) {
                        errorMsg = `Database Error: ${backendError}. The backend is trying to use a UUID where an integer is expected. This is a backend issue - check backend code for product_id usage.`;
                    } else if (typeof backendError === 'string' && backendError.includes('not null')) {
                        errorMsg = `Database Error: ${backendError}. A required field is missing. Check if 'quantity' field needs to be set in backend.`;
                    }
                } else {
                    errorMsg = axiosError.message || `Failed to upload product (Status: ${axiosError.response?.status || 'Unknown'})`;
                }

                // Add status code to error message for 500 errors
                if (axiosError.response?.status === 500) {
                    errorMsg = `Server Error (500): ${errorMsg}`;
                }

                console.error('❌ Final error message to display:', errorMsg);
                setProductError(errorMsg);
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Failed to upload product. Please try again.';
                console.error('❌ Unknown error type:', error);
                setProductError(errorMessage);
            }
        } finally {
            setIsUploadingProduct(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New Product</h2>

            {productError && (
                <AlertMessage
                    type="error"
                    message={productError}
                    onClose={() => setProductError('')}
                />
            )}

            {productSuccess && (
                <AlertMessage
                    type="success"
                    message={productSuccess}
                    onClose={() => setProductSuccess('')}
                />
            )}

            <form onSubmit={handleUploadProduct} className="space-y-6">
                <ProductFormFields
                    productForm={productForm}
                    categories={hardcodedCategories}
                    onFormChange={handleFormChange}
                />

                <ProductImageUpload
                    productImages={productImages}
                    onImageChange={handleProductImageChange}
                    error={productError}
                />

                <button
                    type="submit"
                    disabled={isUploadingProduct}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploadingProduct ? 'Uploading...' : 'Upload Product'}
                </button>
            </form>
        </div>
    );
}