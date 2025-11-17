import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auth API
export const authAPI = {
    // Step 1: Send magic link to email (login/register)
    login: (email: string) => {
        console.log('🔵 API: Sending magic link to email:', email);
        return api.post('/api/auth/log', { email })
            .then(response => {
                console.log('🟢 API: Magic link sent successfully:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Failed to send magic link:', error);
                throw error;
            });
    },
    // Step 2: Verify Supabase access token from email link
    verifyEmail: (token: string) => {
        console.log('🔵 API: Verifying email with token');
        return api.post('/api/auth/varify-email', {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                console.log('🟢 API: Email verified successfully:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Email verification failed:', error);
                throw error;
            });
    },
    // Legacy verify code endpoint (kept for compatibility)
    verifyCode: (email: string, code: string) => api.post('/api/auth/verify', { email, code }),
};

// User API
export const userAPI = {
    getProfile: () => api.post('/user/get-user-profile'),
    updateProfile: (data: unknown) => api.put('/user/profile', data).catch((error) => {
        if (error.response?.status === 404) {
            throw new Error('Profile update endpoint not available. Please implement PUT /user/profile in backend.');
        }
        throw error;
    }),
    getOrders: () => api.post('/user/get-orders'),
    getAddresses: () => api.post('/user/get-user-addresess'),
    getWishlist: () => api.get('/user/wishlist').catch((error) => {
        if (error.response?.status === 404) {
            throw new Error('Wishlist endpoint not available. Please implement GET /user/wishlist in backend.');
        }
        throw error;
    }),
    addToWishlist: (productId: number) => api.post('/user/wishlist', { productId }).catch((error) => {
        if (error.response?.status === 404) {
            throw new Error('Add to wishlist endpoint not available. Please implement POST /user/wishlist in backend.');
        }
        throw error;
    }),
    removeFromWishlist: (productId: number) => api.delete(`/user/wishlist/${productId}`).catch((error) => {
        if (error.response?.status === 404) {
            throw new Error('Remove from wishlist endpoint not available. Please implement DELETE /user/wishlist/:id in backend.');
        }
        throw error;
    }),
    getCart: () => api.get('/user/cart').catch((error) => {
        if (error.response?.status === 404) {
            throw new Error('Cart endpoint not available. Using localStorage only.');
        }
        throw error;
    }),
    saveCart: (cartItems: Array<Record<string, unknown>>) => api.post('/user/cart', { cartItems }).catch((error) => {
        if (error.response?.status === 404) {
            throw new Error('Save cart endpoint not available. Cart saved to localStorage only.');
        }
        throw error;
    }),
    createAddress: (address: unknown) => api.post('/user/create-newAddress', address),
    updateAddress: (addressId: number, address: unknown) => api.put(`/user/update-address/${addressId}`, address).catch((error) => {
        if (error.response?.status === 404) {
            throw new Error('Update address endpoint not available.');
        }
        throw error;
    }),
};

// Product API
export const productAPI = {
    getProducts: () => api.get('/user/show-product'),
    getProductById: (id: number) => api.get(`/user/get-product-byid/${id}`),
    getProductByCategory: (category: string) => api.get(`/user/get-product-byCategory/${category}`),
    searchProduct: (search: string, price?: number) => api.get('/user/search', { params: { search, price } }),
    getCategories: () => {
        console.log('🔵 API: Calling GET /user/get-categories');
        return api.get('/user/get-categories')
            .then(response => {
                console.log('🟢 API: Categories response received:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Get categories request failed:', error);
                throw error;
            });
    },
};

// Admin API
// Note: Admin login uses username/password (no session/token creation)
// Admin routes are not protected by middleware in backend
export const adminAPI = {
    login: (userName: string, password: string) => api.post('/admin/login', { userName, password }),
    addCategory: (name: string) => {
        console.log('🔵 API: Calling POST /admin/add-catagory with:', { name });
        return api.post('/admin/add-catagory', { name })
            .then(response => {
                console.log('🟢 API: Category response received:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Category request failed:', error);
                console.error('❌ API: Error details:', {
                    message: error.message,
                    response: error.response,
                    status: error.response?.status,
                    data: error.response?.data
                });
                throw error;
            });
    },
    uploadProduct: (formData: FormData) => {
        console.log('🔵 API: Calling POST /admin/upload-product');
        return api.post('/admin/upload-product', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
            .then(response => {
                console.log('🟢 API: Product upload response received:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Product upload request failed:', error);
                console.error('❌ API: Error details:', {
                    message: error.message,
                    response: error.response,
                    status: error.response?.status,
                    data: error.response?.data,
                    statusText: error.response?.statusText
                });
                throw error;
            });
    },
    getProducts: () => {
        console.log('🔵 API: Calling GET /admin/get-products');
        return api.get('/admin/get-products')
            .then(response => {
                console.log('🟢 API: Products response received:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Get products request failed:', error);
                throw error;
            });
    },
    updateProduct: (productId: number, data: { price?: number; selling_price?: number; quantity?: number }) => {
        const url = `/admin/update-product/${productId}`;
        console.log(`🔵 API: Calling PATCH ${url} with:`, data);
        return api.patch(url, data)
            .then(response => {
                console.log('🟢 API: Product update response received:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Product update request failed:', error);
                console.error('❌ API: Request URL:', error.config?.url || url);
                console.error('❌ API: Request method:', error.config?.method || 'PATCH');
                console.error('❌ API: Response status:', error.response?.status);
                console.error('❌ API: Response data:', error.response?.data);
                throw error;
            });
    },
    getOrders: () => {
        console.log('🔵 API: Calling GET /admin/get-orders');
        return api.get('/admin/get-orders')
            .then(response => {
                console.log('🟢 API: Orders response received:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Get orders request failed:', error);
                throw error;
            });
    },
    updateOrderStatus: (orderId: string, status: string) => {
        console.log(`🔵 API: Calling PATCH /admin/update-order-status with:`, { order_id: orderId, status });
        return api.patch('/admin/update-order-status', { order_id: orderId, status })
            .then(response => {
                console.log('🟢 API: Order status update response received:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ API: Order status update request failed:', error);
                throw error;
            });
    },
};

