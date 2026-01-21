import React, { useState, useEffect, useRef } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Products from './components/Products';
import Cart from './components/Cart';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import './styles/Header.css';

function AppRoutes() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { i18n } = useTranslation();
  const location = useLocation();
  const prevLangRef = useRef(i18n.language || 'ar');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAdminAuthenticated(!!token);
    updateCartCount();
  }, []);

  useEffect(() => {
    const isAdminPath = location.pathname.startsWith('/admin');

    if (isAdminPath) {
      // Force admin to English, LTR
      if (i18n.language !== 'en') {
        prevLangRef.current = i18n.language;
        i18n.changeLanguage('en');
      }
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    } else {
      // Restore user-chosen language for storefront
      const targetLang = localStorage.getItem('appLang') || prevLangRef.current || 'ar';
      if (i18n.language !== targetLang) {
        i18n.changeLanguage(targetLang);
      }
      document.documentElement.lang = targetLang;
      document.documentElement.dir = targetLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [i18n, location.pathname]);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
  };

  return (
    <div className="App">
      <Routes>
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin/dashboard" />
            ) : (
              <AdminLogin onLoginSuccess={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            isAdminAuthenticated ? (
              <AdminDashboard isAuthenticated={isAdminAuthenticated} />
            ) : (
              <Navigate to="/admin" />
            )
          }
        />

        {/* Customer Routes */}
        <>
          <Route path="/" element={<>
            <Header cartCount={cartCount} />
            <Home />
          </>} />
          <Route path="/products" element={<>
            <Header cartCount={cartCount} />
            <Products />
          </>} />
          <Route path="/cart" element={<>
            <Header cartCount={cartCount} />
            <Cart />
          </>} />
        </>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
