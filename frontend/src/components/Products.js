import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import '../styles/Products.css';

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const extractDriveId = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    try {
      const u = new URL(trimmed);
      if (u.hostname.includes('drive.google.com')) {
        // Prefer explicit id param anywhere in query
        const idParam = u.searchParams.get('id');
        if (idParam) return idParam;
        // Fallback to /file/d/<id>/ path
        const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/);
        if (fileMatch && fileMatch[1]) return fileMatch[1];
      } else if (u.hostname.includes('lh3.googleusercontent.com')) {
        const lhMatch = trimmed.match(/\/d\/([^=]+)/);
        if (lhMatch && lhMatch[1]) return lhMatch[1];
      }
    } catch (_) {
      // Non-URL string: try regex patterns
      const fileMatch = trimmed.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//);
      const idParamMatch = trimmed.match(/id=([^&]+)/);
      if (fileMatch?.[1]) return fileMatch[1];
      if (idParamMatch?.[1]) return idParamMatch[1];
    }
    return '';
  };

  const placeholder = 'https://via.placeholder.com/400x300?text=Image+Unavailable';

  const fallbackDriveId = process.env.REACT_APP_FALLBACK_DRIVE_ID || '';

  const primaryImageUrl = (url) => {
    const trimmed = (url || '').trim();
    const id = extractDriveId(trimmed);
    if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    if (trimmed) return trimmed;
    if (fallbackDriveId) return `https://drive.google.com/uc?export=view&id=${fallbackDriveId}`;
    return 'https://via.placeholder.com/400x300?text=Image+Unavailable';
  };

  const driveFallbacks = (url) => {
    const trimmed = (url || '').trim();
    const id = extractDriveId(trimmed) || (fallbackDriveId ? fallbackDriveId : '');
    if (!id) return [trimmed || 'https://via.placeholder.com/400x300?text=Image+Unavailable'];
    return [
      `https://drive.google.com/uc?export=view&id=${id}`,
      `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
      `https://drive.google.com/uc?export=download&id=${id}`,
      `https://lh3.googleusercontent.com/d/${id}=s1000`
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
      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Unavailable';
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/products', { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item._id === product._id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} ${t('products.added')}`);
  };

  return (
    <div className="products-container">
      <div className="products-header">
          <h1>{t('products.title')}</h1>
        <div className="search-filter-section">
          <input
            type="text"
              placeholder={t('products.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
              <option value="">{t('products.allCategories')}</option>
            {categories.map(category => (
              <option key={category._id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">{t('products.loading')}</div>
      ) : products.length === 0 ? (
        <div className="no-products">{t('products.noProducts')}</div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image-wrapper">
                <img
                  src={primaryImageUrl(product.image)}
                  alt={product.name}
                  className="product-image"
                  data-fallback-idx="0"
                  onError={(e) => handleImageError(e, product.image)}
                />
                {product.discount > 0 && (
                  <div className="discount-badge">-{product.discount}%</div>
                )}
              </div>
              <div className="product-content">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-pricing">
                  {product.discount > 0 ? (
                    <>
                      <span className="original-price">SYP {product.price.toFixed(2)}</span>
                      <span className="final-price">SYP {product.finalPrice.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="final-price">SYP {product.price.toFixed(2)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="add-to-cart-btn"
                >
                  {t('products.addToCart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
