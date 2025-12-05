import axios from 'axios';

// const API_BASE_URL = "https://islamicdecotweb.onrender.com";
// const API_BASE_URL = "https://backend.kiswahmakkahstore.com";
const API_BASE_URL = "http://localhost:8080";


export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies if backend sets httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (debugging)
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor (debugging)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// Auth API - OTP only
export const authAPI = {
  // Send OTP to email (also used for "resend")
  sendOtp: (email: string) => api.post('/api/auth/log', { email }).catch((error: any) => {
    console.error('sendOtp failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP';
    throw new Error(message);
  }),

  // Verify OTP code
  verifyOtp: (email: string, otp: string) => api.post('/api/auth/varify-email', { email, otp }).catch((error: any) => {
    console.error('verifyOtp failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'OTP verification failed';
    throw new Error(message);
  }),
};

// User API
export const userAPI = {
  getProfile: () =>
    api.post('/user/get-user-profile', {}, { withCredentials: true }).catch((error: any) => {
      console.error('getProfile failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load profile';
      throw new Error(message);
    }),

  getOrders: () =>
    api.post('/user/get-orders', {}, { withCredentials: true }).catch((error: any) => {
      console.error('getOrders failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load orders';
      throw new Error(message);
    }),

  getAddresses: () =>
    api.post('/user/get-user-addresess', {}, { withCredentials: true }).catch((error: any) => {
      console.error('getAddresses failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load addresses. Please try again later.';
      throw new Error(message);
    }),

  getCart: () =>
    api.post('/user/get-user-cart', {}, { withCredentials: true }).catch((error) => {
      console.error('getCart failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Cart endpoint not available. Using localStorage only.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required for cart. Using localStorage only.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load cart';
      throw new Error(message);
    }),

  saveCart: (cartItems: Array<Record<string, unknown>>) =>
    api.post('/user/save-cart', { cartItems }, { withCredentials: true }).catch((error: any) => {
      console.error('saveCart failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Save cart endpoint not available. Cart saved to localStorage only.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to save cart. Cart saved to localStorage only.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save cart';
      throw new Error(message);
    }),

  addToCart: (productId: number, quantity: number) =>
    api.post('/user/add-to-cart', { product_id: productId, quantity }, { withCredentials: true }).catch((error: any) => {
      console.error('addToCart failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Add to cart endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to add to cart.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add to cart';
      throw new Error(message);
    }),

  removeFromCart: (productId: number) =>
    api.get(`/user/remove-cart-by-product/${productId}`, { withCredentials: true }).catch((error: any) => {
      console.error('removeFromCart failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Remove from cart endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to remove from cart.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to remove from cart';
      throw new Error(message);
    }),

  updateCartItem: (productId: number, quantity: number) =>
    api.post('/user/update-cart-item', { product_id: productId, quantity }, { withCredentials: true }).catch((error: any) => {
      console.error('updateCartItem failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Update cart item endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to update cart item.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update cart item';
      throw new Error(message);
    }),

  clearCart: () =>
    api.post('/user/clear-cart', {}, { withCredentials: true }).catch((error: any) => {
      console.error('clearCart failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Clear cart endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to clear cart.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to clear cart';
      throw new Error(message);
    }),

  createAddress: async (address: unknown) => {
    try {
      const response = await api.post('/user/create-newAddress', address);
      return response;
    } catch (error: any) {
      console.error('Error creating address:', error);
      const apiError = error as { response?: { data?: { message?: string; error?: string }, status?: number } };
      const apiErrorMessage = apiError.response?.data?.message || apiError.response?.data?.error || error.message || 'Failed to create address';
      if (apiErrorMessage.includes('phone') &&
        (apiErrorMessage.includes('already') ||
          apiErrorMessage.includes('exist') ||
          apiErrorMessage.includes('unique'))) {
        throw new Error('An address with this phone number already exists.');
      } else {
        throw new Error(apiErrorMessage);
      }
    }
  },

  updateAddress: async (addressId: number, address: Record<string, unknown>) => {
    try {
      const response = await api.patch('/user/update-user-address', { address_id: addressId, ...address });
      return response;
    } catch (error: any) {
      console.error('Error updating address:', error);
      const apiError = error as { response?: { data?: { message?: string; error?: string }, status?: number } };
      const apiErrorMessage = apiError.response?.data?.message || apiError.response?.data?.error || error.message || 'Failed to update address';
      if (apiErrorMessage.includes('phone') &&
        (apiErrorMessage.includes('already') ||
          apiErrorMessage.includes('exist') ||
          apiErrorMessage.includes('unique'))) {
        throw new Error('An address with this phone number already exists.');
      } else {
        throw new Error(apiErrorMessage);
      }
    }
  },

  createOrder: async (orderData: { address_id: number; items: Array<{ product_id: number; quantity: number }> }) => {
    const user = localStorage.getItem('user');
    let userId = null;
    if (user) {
      try {
        const userData = JSON.parse(user);
        userId = userData.id;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    try {
      const response = await api.post('/user/create-order', {
        ...orderData,
        decode_user: userId
      }, {
        withCredentials: true
      });

      return response;
    } catch (error: any) {
      console.error('Error creating order:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create order';
      throw new Error(message);
    }
  },

  cancelOrder: (orderId: string) => api.post("/user/cancel-order", { order_id: orderId }).catch((error: any) => {
    console.error('cancelOrder failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to cancel order';
    throw new Error(message);
  }),
};

// Product API
export const productAPI = {
  getProducts: () => api.get('/user/show-product').catch((error: any) => {
    console.error('getProducts failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load products';
    throw new Error(message);
  }),

  getProductById: (id: number) => api.get(`/user/get-product-byid/${id}`).catch((error: any) => {
    console.error('getProductById failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || `Failed to load product ${id}`;
    throw new Error(message);
  }),

  getProductByCategory: (category: string) => api.get(`/user/get-product-byCategory/${category}`).catch((error: any) => {
    console.error('getProductByCategory failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || `Failed to load products for category ${category}`;
    throw new Error(message);
  }),

  searchProduct: (search: string, price?: number) => api.post('/user/search', { search, price }).catch((error: any) => {
    console.error('searchProduct failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to search products';
    throw new Error(message);
  }),

  getCategories: () => api.get('/user/get-categories').catch((error: any) => {
    console.error('getCategories failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load categories';
    throw new Error(message);
  }),

  // Review APIs
  addProductReview: (reviewData: FormData) => api.post('/user/product-reviews', reviewData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).catch((error: any) => {
    console.error('addProductReview failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add review';
    throw new Error(message);
  }),

  getProductReviews: (productId: number) => api.get(`/user/get-product-reviews/${productId}`).catch((error: any) => {
    console.error('getProductReviews failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load reviews';
    throw new Error(message);
  }),
};

// Admin API
export const adminAPI = {
  login: (userName: string, password: string) => api.post('/admin/login', { userName, password }).catch((error: any) => {
    console.error('adminLogin failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Admin login failed';
    throw new Error(message);
  }),

  addCategory: (name: string) => api.post('/admin/add-catagory', { name }).catch((error: any) => {
    console.error('addCategory failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add category';
    throw new Error(message);
  }),

  uploadProduct: (formData: FormData) => api.post('/admin/upload-product', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).catch((error: any) => {
    console.error('uploadProduct failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to upload product';
    throw new Error(message);
  }),

  getProducts: () => api.get('/admin/get-products').catch((error: any) => {
    console.error('adminGetProducts failed:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load admin products';
    throw new Error(message);
  }),

  updateProduct: (productId: number, data: { price?: number; selling_price?: number; quantity?: number }) =>
    api.patch(`/admin/update-product/${productId}`, data).catch((error: any) => {
      console.error('updateProduct failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || `Failed to update product ${productId}`;
      throw new Error(message);
    }),

  updateFullProduct: (productId: number, formData: FormData) =>
    api.patch(`/admin/update-product/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).catch((error: any) => {
      console.error('updateFullProduct failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || `Failed to update product ${productId}`;
      throw new Error(message);
    }),

  getOrders: () => api.get('/admin/get-orders').catch((error: any) => {
    console.error('adminGetOrders failed:', error);
    // If it's a 404 (no orders found), return a successful response with empty orders
    if (error.response?.status === 404) {
      return { data: { status: true, orders: [] } };
    }
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load admin orders';
    throw new Error(message);
  }),

  updateOrderStatus: (orderId: string, status: string) =>
    api.patch('/admin/update-order-status', { order_id: orderId, status }).catch((error: any) => {
      console.error('updateOrderStatus failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || `Failed to update order status for ${orderId}`;
      throw new Error(message);
    }),

  deleteProduct: (productId: number) =>
    api.delete('/admin/delete-product', { data: { productId } }).catch((error: any) => {
      console.error('deleteProduct failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || `Failed to delete product ${productId}`;
      throw new Error(message);
    }),
};