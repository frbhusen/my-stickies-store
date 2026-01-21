import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Cart.css';
import api from '../utils/api';

const Cart = () => {
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    city: '',
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const extractDriveId = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    const fileMatch = trimmed.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//);
    const openMatch = trimmed.match(/https?:\/\/drive\.google\.com\/open\?id=([^&]+)/);
    const ucMatch = trimmed.match(/https?:\/\/drive\.google\.com\/uc\?id=([^&]+)/);
    return fileMatch?.[1] || openMatch?.[1] || ucMatch?.[1] || '';
  };

  const primaryImageUrl = (url) => {
    const id = extractDriveId(url);
    if (!id) return (url || '').trim();
    return `https://drive.google.com/uc?export=view&id=${id}`;
  };

  const driveFallbacks = (url) => {
    const id = extractDriveId(url);
    if (!id) return [(url || '').trim()];
    return [
      `https://drive.google.com/uc?export=view&id=${id}`,
      `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
      `https://drive.google.com/uc?export=download&id=${id}`,
      `https://lh3.googleusercontent.com/d/${id}=s800`
    ];
  };

  const handleImageError = (e, url) => {
    const fallbacks = driveFallbacks(url);
    const idx = Number(e.target.getAttribute('data-fallback-idx') || 0);
    const next = idx + 1;
    if (next < fallbacks.length) {
      e.target.setAttribute('data-fallback-idx', next);
      e.target.src = fallbacks[next];
    } else {
      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Unavailable';
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter(item => item._id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.finalPrice || item.price * (1 - (item.discount || 0) / 100);
      return total + (price * item.quantity);
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        customer: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          city: formData.city
        },
        email: formData.email,
        items: cartItems.map(item => ({
          product: item._id,
          productName: item.name,
          quantity: item.quantity,
          price: item.finalPrice || item.price * (1 - (item.discount || 0) / 100),
          discount: item.discount || 0
        })),
        totalAmount: calculateTotal()
      };

      const response = await api.post('/orders', orderData);

      if (response.status === 201) {
        setSubmitted(true);
        localStorage.setItem('cart', JSON.stringify([]));
        setCartItems([]);
        setFormData({ fullName: '', phoneNumber: '', city: '', email: '' });

        // Reset form after 5 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      }
    } catch (error) {
      alert('Error placing order: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !submitted) {
    return (
      <div className="cart-container">
        <h1>{t('cart.title')}</h1>
        <div className="empty-cart">
          <p>{t('cart.empty')}</p>
          <p>{t('cart.emptyHelp')}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="cart-container">
        <div className="order-success-message">
          <div className="success-icon">✓</div>
          <h2>{t('cart.successTitle')}</h2>
          <p>{t('cart.successThanks')}</p>
          <p>{t('cart.successCheckEmail')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>{t('cart.title')}</h1>

      <div className="cart-content">
        <div className="cart-items-section">
          <h2>{t('cart.itemsTitle')}</h2>
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div key={item._id} className="cart-item">
                <img
                  src={primaryImageUrl(item.image)}
                  alt={item.name}
                  className="item-image"
                  data-fallback-idx="0"
                  onError={(e) => handleImageError(e, item.image)}
                />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p className="item-price">
                    SYP {(item.finalPrice || item.price * (1 - (item.discount || 0) / 100)).toFixed(2)}
                  </p>
                </div>
                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                </div>
                <div className="item-total">
                  SYP {((item.finalPrice || item.price * (1 - (item.discount || 0) / 100)) * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="remove-btn"
                >
                  {t('cart.remove')}
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>{t('cart.summaryTitle')}</h3>
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>SYP {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{t('cart.shipping')}</span>
              <span>{t('cart.free')}</span>
            </div>
            <div className="summary-total">
              <span>{t('cart.total')}</span>
              <span>SYP {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="checkout-form-section">
          <h2>{t('cart.checkoutTitle')}</h2>
          <form onSubmit={handleSubmitOrder} className="checkout-form">
            <div className="form-group">
              <label htmlFor="fullName">{t('cart.fullName')} *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">{t('cart.phoneNumber')} *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">{t('cart.city')} *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('cart.emailOptional')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="submit-order-btn" disabled={loading}>
              {loading ? t('cart.placingOrder') : t('cart.placeOrder')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cart;
