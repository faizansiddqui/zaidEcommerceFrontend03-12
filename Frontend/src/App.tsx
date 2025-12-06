// App.tsx
import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import BestSellers from './components/BestSellers';
import NewArrivals from './components/NewArrivals';
import Features from './components/Features';
import ProductGrid from './components/Product/ProductGrid';
import Footer from './components/Footer/Footer';
import WhatsAppButton from './components/WhatsAppButton';

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
  const location = useLocation();

  // Determine if we should show the WhatsApp button
  // Don't show on admin panel or login page
  const shouldShowWhatsApp = !location.pathname.startsWith('/admin') &&
    location.pathname !== '/log' &&
    location.pathname !== '/auth/callback';

  return (
    <>
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

      {/* WhatsApp Button - shown on all pages except admin and login */}
      {shouldShowWhatsApp && (
        <WhatsAppButton
          phoneNumber="917652087193"
          message="Hi Abdulla Islamic Store, I came across your website and would like to discuss about products."
          position="right"
        />
      )}
    </>
  );
}