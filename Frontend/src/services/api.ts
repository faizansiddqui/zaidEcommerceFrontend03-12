import axios from 'axios';

const API_BASE_URL = "https://islamicdecotweb.onrender.com";
// const API_BASE_URL = "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies if backend sets httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (debugging)
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - could redirect to login
      console.warn('Unauthorized access. Redirecting to login.');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.warn('Forbidden. Check permissions.');
    } else if (error.response?.status >= 500) {
      console.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout. Please check your connection.');
    }

    // iOS/Safari specific logging
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && (error.message.includes('Network Error') || error.code === 'CORS')) {
      console.warn('iOS Safari CORS/credentials issue detected. Check backend configuration.');
    }

    return Promise.reject(error);
  }
);

// Auth API - OTP only
export const authAPI = {
  // Send OTP to email (also used for "resend")
  sendOtp: async (email: string) => {
    try {
      const response = await api.post('/api/auth/log', { email });
      return response;
    } catch (error: any) {
      console.error('sendOtp API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP';
      throw new Error(message);
    }
  },

  // Verify OTP code
  verifyOtp: async (email: string, otp: string) => {
    try {
      const response = await api.post('/api/auth/varify-email', { email, otp });
      return response;
    } catch (error: any) {
      console.error('verifyOtp API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'OTP verification failed';
      throw new Error(message);
    }
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    try {
      const response = await api.post('/user/get-user-profile', {});
      return response;
    } catch (error: any) {
      console.error('getProfile API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load profile';
      throw new Error(message);
    }
  },

  getOrders: async () => {
    try {
      const response = await api.post('/user/get-orders', {});
      return response;
    } catch (error: any) {
      console.error('getOrders API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load orders';
      throw new Error(message);
    }
  },

  getAddresses: async () => {
    try {
      // Changed to GET for better semantics and iOS compatibility; fixed endpoint typo
      const response = await api.get('/user/get-user-addresses', { withCredentials: true });
      return response;
    } catch (error: any) {
      console.error('getAddresses API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load addresses. Please try again later.';
      throw new Error(message);
    }
  },

  getCart: async () => {
    try {
      const response = await api.post('/user/get-user-cart', {});
      return response;
    } catch (error: any) {
      console.error('getCart API failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Cart endpoint not available. Using localStorage only.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required for cart. Using localStorage only.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load cart';
      throw new Error(message);
    }
  },

  saveCart: async (cartItems: Array<Record<string, unknown>>) => {
    try {
      const response = await api.post('/user/save-cart', { cartItems });
      return response;
    } catch (error: any) {
      console.error('saveCart API failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Save cart endpoint not available. Cart saved to localStorage only.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to save cart. Cart saved to localStorage only.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to save cart';
      throw new Error(message);
    }
  },

  addToCart: async (productId: number, quantity: number) => {
    try {
      const response = await api.post('/user/add-to-cart', { product_id: productId, quantity });
      return response;
    } catch (error: any) {
      console.error('addToCart API failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Add to cart endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to add to cart.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to add to cart';
      throw new Error(message);
    }
  },

  removeFromCart: async (productId: number) => {
    try {
      const response = await api.get(`/user/remove-cart-by-product/${productId}`);
      return response;
    } catch (error: any) {
      console.error('removeFromCart API failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Remove from cart endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to remove from cart.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to remove from cart';
      throw new Error(message);
    }
  },

  updateCartItem: async (productId: number, quantity: number) => {
    try {
      const response = await api.post('/user/update-cart-item', { product_id: productId, quantity });
      return response;
    } catch (error: any) {
      console.error('updateCartItem API failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Update cart item endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to update cart item.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to update cart item';
      throw new Error(message);
    }
  },

  clearCart: async () => {
    try {
      const response = await api.post('/user/clear-cart', {});
      return response;
    } catch (error: any) {
      console.error('clearCart API failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Clear cart endpoint not available.');
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication required to clear cart.');
      }
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to clear cart';
      throw new Error(message);
    }
  },

  createAddress: async (address: unknown) => {
    try {
      const response = await api.post('/user/create-newAddress', address);
      return response;
    } catch (error: any) {
      console.error('createAddress API failed:', error);
      const apiErrorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      if (apiErrorMessage.includes('phone') &&
        (apiErrorMessage.includes('already') ||
          apiErrorMessage.includes('exist') ||
          apiErrorMessage.includes('unique'))) {
        throw new Error('An address with this phone number already exists.');
      } else {
        throw new Error(apiErrorMessage || 'Failed to create address');
      }
    }
  },

  updateAddress: async (addressId: number, address: Record<string, unknown>) => {
    try {
      const response = await api.patch('/user/update-user-address', { address_id: addressId, ...address });
      return response;
    } catch (error: any) {
      console.error('updateAddress API failed:', error);
      const apiErrorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      if (apiErrorMessage.includes('phone') &&
        (apiErrorMessage.includes('already') ||
          apiErrorMessage.includes('exist') ||
          apiErrorMessage.includes('unique'))) {
        throw new Error('An address with this phone number already exists.');
      } else {
        throw new Error(apiErrorMessage || 'Failed to update address');
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
      });
      return response;
    } catch (error: any) {
      console.error('createOrder API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create order';
      throw new Error(message);
    }
  },

  cancelOrder: async (orderId: string) => {
    try {
      const response = await api.post("/user/cancel-order", { order_id: orderId });
      return response;
    } catch (error: any) {
      console.error('cancelOrder API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to cancel order';
      throw new Error(message);
    }
  },
};

// Product API
export const productAPI = {
  getProducts: async () => {
    try {
      const response = await api.get('/user/show-product');
      return response;
    } catch (error: any) {
      console.error('getProducts API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load products';
      throw new Error(message);
    }
  },

  getProductById: async (id: number) => {
    try {
      const response = await api.get(`/user/get-product-byid/${id}`);
      return response;
    } catch (error: any) {
      console.error('getProductById API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || `Failed to load product ${id}`;
      throw new Error(message);
    }
  },

  getProductByCategory: async (category: string) => {
    try {
      const response = await api.get(`/user/get-product-byCategory/${category}`);
      return response;
    } catch (error: any) {
      console.error('getProductByCategory API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || `Failed to load products for category ${category}`;
      throw new Error(message);
    }
  },

  searchProduct: async (search: string, price?: number) => {
    try {
      const response = await api.post('/user/search', { search, price });
      return response;
    } catch (error: any) {
      console.error('searchProduct API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to search products';
      throw new Error(message);
    }
  },

  getCategories: async () => {
    try {
      const response = await api.get('/user/get-categories');
      return response;
    } catch (error: any) {
      console.error('getCategories API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load categories';
      throw new Error(message);
    }
  },
};

// Admin API
export const adminAPI = {
  login: async (userName: string, password: string) => {
    try {
      const response = await api.post('/admin/login', { userName, password });
      return response;
    } catch (error: any) {
      console.error('adminLogin API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Admin login failed';
      throw new Error(message);
    }
  },

  addCategory: async (name: string) => {
    try {
      const response = await api.post('/admin/add-catagory', { name });
      return response;
    } catch (error: any) {
      console.error('addCategory API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to add category';
      throw new Error(message);
    }
  },

  uploadProduct: async (formData: FormData) => {
    try {
      const response = await api.post('/admin/upload-product', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error: any) {
      console.error('uploadProduct API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to upload product';
      throw new Error(message);
    }
  },

  getProducts: async () => {
    try {
      const response = await api.get('/admin/get-products');
      return response;
    } catch (error: any) {
      console.error('adminGetProducts API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load admin products';
      throw new Error(message);
    }
  },

  updateProduct: async (productId: number, data: { price?: number; selling_price?: number; quantity?: number }) => {
    try {
      const response = await api.patch(`/admin/update-product/${productId}`, data);
      return response;
    } catch (error: any) {
      console.error('updateProduct API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || `Failed to update product ${productId}`;
      throw new Error(message);
    }
  },

  getOrders: async () => {
    try {
      const response = await api.get('/admin/get-orders');
      return response;
    } catch (error: any) {
      console.error('adminGetOrders API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load admin orders';
      throw new Error(message);
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      const response = await api.patch('/admin/update-order-status', { order_id: orderId, status });
      return response;
    } catch (error: any) {
      console.error('updateOrderStatus API failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || `Failed to update order status for ${orderId}`;
      throw new Error(message);
    }
  },
};