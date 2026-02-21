import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import logo from '../assets/logo.png';
import '../styles/Products.css';

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [view, setView] = useState('categories'); // 'categories' | 'subcategories' | 'products'
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('SYP');

  const extractDriveId = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    try {
      const u = new URL(trimmed);
      if (u.hostname.includes('drive.google.com')) {
        const idParam = u.searchParams.get('id');
        if (idParam) return idParam;
        const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/);
        if (fileMatch && fileMatch[1]) return fileMatch[1];
      } else if (u.hostname.includes('lh3.googleusercontent.com')) {
        const lhMatch = trimmed.match(/\/d\/([^=]+)/);
        if (lhMatch && lhMatch[1]) return lhMatch[1];
      }
    } catch (_) {
      const fileMatch = trimmed.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//);
      const idParamMatch = trimmed.match(/id=([^&]+)/);
      if (fileMatch?.[1]) return fileMatch[1];
      if (idParamMatch?.[1]) return idParamMatch[1];
    }
    return '';
  };

  const fallbackDriveId = process.env.REACT_APP_FALLBACK_DRIVE_ID || '';

  const primaryImageUrl = (url) => {
    const trimmed = (url || '').trim();
    const id = extractDriveId(trimmed);
    if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    if (trimmed) return trimmed;
    if (fallbackDriveId) return `https://drive.google.com/uc?export=view&id=${fallbackDriveId}`;
    return logo;
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
      e.target.src = logo;
    }
  };

  const blockImageActions = (e) => {
    e.preventDefault();
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories', { params: { type: 'product' } });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchSubCategories = useCallback(async (categoryId) => {
    try {
      const params = { type: 'product' };
      if (categoryId) params.category = categoryId;
      const response = await api.get('/subcategories', { params });
      setSubCategories(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      return [];
    }
  }, []);

  const fetchProducts = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const params = { type: 'product' };
      if (searchTerm) params.search = searchTerm;
      if (opts.category) params.category = opts.category;
      else if (selectedCategoryObj) params.category = selectedCategoryObj._id;
      if (opts.subCategory) params.subCategory = opts.subCategory;
      else if (selectedSubCategory) params.subCategory = selectedSubCategory._id;

      if (params.category) params.category = String(params.category);
      if (params.subCategory) params.subCategory = String(params.subCategory);

      const response = await api.get('/products', { params });
      setProducts(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoryObj, selectedSubCategory]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/settings');
        setCurrency(response.data?.currency || 'SYP');
      } catch (error) {
        setCurrency('SYP');
      }
    };
    loadSettings();
  }, []);

  const formatPrice = (value, itemCurrency = null) => {
    const amount = Number(value || 0).toFixed(2);
    const displayCurrency = itemCurrency || currency;
    return displayCurrency === 'USD' ? `$${amount}` : `SYP ${amount}`;
  };

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

  const handleCategoryClick = async (category) => {
    setSelectedCategoryObj(category);
    setProducts([]);
    const subs = await fetchSubCategories(category._id);
    if (subs && subs.length > 0) {
      setView('subcategories');
      const allCategoryProducts = await fetchProducts({ category: category._id });
      const directProducts = (allCategoryProducts || []).filter(p => !p.subCategory);
      setCategoryProducts(directProducts);
    } else {
      setView('products');
      await fetchProducts({ category: category._id });
    }
  };

  const handleSubCategoryClick = async (subCat) => {
    setSelectedSubCategory(subCat);
    setProducts([]);
    setView('products');
    await fetchProducts({ subCategory: String(subCat._id) });
  };

  const handleBackToCategories = () => {
    setView('categories');
    setSelectedCategoryObj(null);
    setSelectedSubCategory(null);
    setSubCategories([]);
    setCategoryProducts([]);
    fetchProducts();
  };

  const handleBackToSubCategories = () => {
    setView('subcategories');
    setSelectedSubCategory(null);
    if (selectedCategoryObj) {
      fetchSubCategories(selectedCategoryObj._id);
      fetchProducts({ category: selectedCategoryObj._id }).then((allCategoryProducts) => {
        const directProducts = (allCategoryProducts || []).filter(p => !p.subCategory);
        setCategoryProducts(directProducts);
      });
    }
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
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">{t('products.loading')}</div>
      ) : (
        <>
          {view === 'categories' && (
            <div className="eservices-grid">
              {categories.map(cat => (
                <div key={cat._id} className="service-card" onClick={() => handleCategoryClick(cat)}>
                  <div className={`service-image-wrapper${cat.image ? '' : ' logo-default'}`}>
                    <img
                      src={primaryImageUrl(cat.image)}
                      alt={cat.name}
                      className={`service-image${cat.image ? '' : ' logo-default'}`}
                      data-fallback-idx="0"
                      onError={(e) => handleImageError(e, cat.image)}
                      onContextMenu={blockImageActions}
                      onDragStart={blockImageActions}
                      draggable={false}
                    />
                  </div>
                  <div className="service-content">
                    <h3>{cat.name}</h3>
                    <p className="service-description">{cat.description}</p>
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat); }}
                    >
                      {t('products.openCategory', 'Open')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'subcategories' && (
            <div className="subcategories-panel">
              <button className="back-btn" onClick={handleBackToCategories}>{t('products.backToCategories')}</button>
              <h2>{selectedCategoryObj?.name}</h2>
              {categoryProducts.length > 0 && (
                <div className="eservices-grid" style={{ marginBottom: '1.5rem' }}>
                  {categoryProducts.map(product => (
                    <div key={product._id} className="service-card">
                      <div className="service-image-wrapper">
                        <img
                          src={primaryImageUrl(product.image)}
                          alt={product.name}
                          className={`service-image${product.image ? '' : ' logo-default'}`}
                          data-fallback-idx="0"
                          onError={(e) => handleImageError(e, product.image)}
                          onContextMenu={blockImageActions}
                          onDragStart={blockImageActions}
                          draggable={false}
                        />
                        {product.discount > 0 && <div className="discount-badge">-{product.discount}%</div>}
                      </div>
                      <div className="service-content">
                        <h3>{product.name}</h3>
                        <p className="service-description">{product.description}</p>
                        <div className="service-pricing">
                          {product.discount > 0 ? (
                            <>
                              <span className="original-price">{formatPrice(product.price, product.currency)}</span>
                              <span className="final-price">{formatPrice(product.finalPrice, product.currency)}</span>
                            </>
                          ) : (
                            <span className="final-price">{formatPrice(product.price, product.currency)}</span>
                          )}
                        </div>
                        <button onClick={() => handleAddToCart(product)} className="add-to-cart-btn">
                          {t('products.addToCart')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="eservices-grid">
                {subCategories.map(sc => (
                  <div key={sc._id} className="service-card" onClick={() => handleSubCategoryClick(sc)}>
                    <div className={`service-image-wrapper${sc.image ? '' : ' logo-default'}`}>
                      <img
                        src={primaryImageUrl(sc.image)}
                        alt={sc.name}
                        className={`service-image${sc.image ? '' : ' logo-default'}`}
                        data-fallback-idx="0"
                        onError={(e) => handleImageError(e, sc.image)}
                        onContextMenu={blockImageActions}
                        onDragStart={blockImageActions}
                        draggable={false}
                      />
                    </div>
                    <div className="service-content">
                      <h3>{sc.name}</h3>
                      <p className="service-description">{sc.description}</p>
                      <button
                        className="add-to-cart-btn"
                        onClick={(e) => { e.stopPropagation(); handleSubCategoryClick(sc); }}
                      >
                        {t('products.openSubCategory', 'Open')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'products' && (
            <div className="products-panel">
              <div className="products-header">
                <button className="back-btn" onClick={handleBackToSubCategories}>{t('products.backToSubCategories')}</button>
                <h2>{selectedSubCategory?.name || selectedCategoryObj?.name}</h2>
              </div>
              <div className="eservices-grid">
                {products.map(product => (
                  <div key={product._id} className="service-card">
                    <div className="service-image-wrapper">
                      <img
                        src={primaryImageUrl(product.image)}
                        alt={product.name}
                        className="service-image"
                        data-fallback-idx="0"
                        onError={(e) => handleImageError(e, product.image)}
                        onContextMenu={blockImageActions}
                        onDragStart={blockImageActions}
                        draggable={false}
                      />
                      {product.discount > 0 && <div className="discount-badge">-{product.discount}%</div>}
                    </div>
                    <div className="service-content">
                      <h3>{product.name}</h3>
                      <p className="service-description">{product.description}</p>
                      <div className="service-pricing">
                        {product.discount > 0 ? (
                          <>
                            <span className="original-price">{formatPrice(product.price, product.currency)}</span>
                            <span className="final-price">{formatPrice(product.finalPrice, product.currency)}</span>
                          </>
                        ) : (
                          <span className="final-price">{formatPrice(product.price, product.currency)}</span>
                        )}
                      </div>
                      <button onClick={() => handleAddToCart(product)} className="add-to-cart-btn">
                        {t('products.addToCart')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
