// App.tsx
import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import BestSellers from './components/BestSellers';
import NewArrivals from './components/NewArrivals';
import Features from './components/Features';
import ProductGrid from './components/Product/ProductGrid';
import Footer from './components/Footer/Footer';

import AdminPage from './Admin/AdminPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import ProfilePageTabs from './pages/ProfilePageTabs';
import CategoryPage from './pages/Category/CategoryPage';
import ContactPage from './pages/ContactPage';
import ShippingInfoPage from './pages/ShippingInfoPage';
import ReturnsPage from './pages/ReturnsPage';
import FAQPage from './pages/FAQPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrderSuccess from './pages/checkout/OrderSuccess';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SearchPage from './pages/SearchPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import WishlistPage from './pages/WishlistPage';
import SettingsPage from './pages/SettingsPage';

// Custom WhatsApp Icon Component
const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

type HomeProps = { searchQuery: string; setSearchQuery: (q: string) => void };

function Home({ searchQuery, setSearchQuery }: HomeProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar onSearchChange={setSearchQuery} />
      <Hero />
      <BestSellers />
      <NewArrivals />
      <ProductGrid searchQuery={searchQuery} />
      <Features />
      <Footer />

      {/* WhatsApp Chat Button */}
      <a
        href="https://wa.me/917652087193?text=Hi%20Abdulla%20Islamic%20Store%2C%20I%20came%20across%20your%20website%20and%20would%20like%20to%20discuss%20about%20products.%20"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppIcon size={24} />
      </a>
    </div>
  );
}

function ProductRouteWrapper() {
  const { id } = useParams();
  const idNum = id ? parseInt(id, 10) : null;
  if (!idNum) {
    return <Navigate to="/" replace />;
  }
  return <ProductDetailsPage productId={idNum} />;
}

function OrderRouteWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/orders" replace />;
  return <OrderDetailsPage orderId={id} onBack={() => navigate('/orders')} />;
}

export default function App() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Home searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />

      <Route
        path="/admin"
        element={
          <AdminPage onBack={() => navigate('/')} />
        }
      />

      <Route path="/cart" element={<CartPage onBack={() => navigate('/')} />} />
      <Route path="/checkout" element={<CheckoutPage onBack={() => navigate('/cart')} />} />
      <Route path="/log" element={<LoginPage onBack={() => navigate('/')} />} />
      <Route path="/auth/callback" element={<LoginPage onBack={() => navigate('/')} />} />
      <Route path="/profile" element={<ProfilePageTabs onBack={() => navigate('/')} />} />
      <Route path="/orders" element={<MyOrdersPage onBack={() => navigate('/profile')} />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/settings" element={<SettingsPage onBack={() => navigate('/profile')} />} />
      <Route path="/order-success" element={<OrderSuccess onContinueShopping={() => navigate('/')} />} />
      <Route path="/order/:id" element={<OrderRouteWrapper />} />
      <Route path="/product/:id" element={<ProductRouteWrapper />} />
      <Route path="/categories" element={<CategoryPage onBack={() => navigate('/')} onSearchChange={setSearchQuery} />} />
      <Route path="/search" element={<SearchPage onBack={() => navigate('/')} onSearchChange={setSearchQuery} />} />
      <Route path="/contact" element={<ContactPage onBack={() => navigate('/')} />} />
      <Route path="/shipping" element={<ShippingInfoPage onBack={() => navigate('/')} />} />
      <Route path="/returns" element={<ReturnsPage onBack={() => navigate('/')} />} />
      <Route path="/faq" element={<FAQPage onBack={() => navigate('/')} />} />
      <Route path="/privacy" element={<PrivacyPolicyPage onBack={() => navigate('/')} />} />
      <Route path="/terms" element={<TermsOfServicePage onBack={() => navigate('/')} />} />

      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}