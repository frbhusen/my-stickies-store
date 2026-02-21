import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import logo from '../assets/logo.png';
import '../styles/EServices.css';

const EServices = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [view, setView] = useState('categories'); // 'categories' | 'subcategories' | 'products'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
      const response = await api.get('/categories?type=eservice');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchSubCategories = useCallback(async (categoryId) => {
    try {
      const params = { type: 'eservice' };
      if (categoryId) params.category = categoryId;
      const response = await api.get('/subcategories', { params });
      setSubCategories(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      return [];
    }
  }, []);

  const fetchServices = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      let params = { type: 'eservice' };
      if (searchTerm) params.search = searchTerm;
      if (opts.category) params.category = opts.category;
      else if (selectedCategory) params.category = selectedCategory._id;
      if (opts.subCategory) params.subCategory = opts.subCategory;
      else if (selectedSubCategory) params.subCategory = selectedSubCategory._id;

      // normalize ids to plain strings to ensure query params are sent correctly
      if (params.category) params.category = String(params.category);
      if (params.subCategory) params.subCategory = String(params.subCategory);

      // debug: help trace why sub-category filtering might be ignored
      // remove in production
      // eslint-disable-next-line no-console
      console.debug('fetchServices -> params', params);

      const response = await api.get('/products', { params });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, [fetchCategories, fetchServices]);

  const handleAddToCart = (service) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item._id === service._id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...service, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${service.name} ${t('eservices.added')}`);
  };

  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setServices([]);
    const subs = await fetchSubCategories(category._id);
    if (subs && subs.length > 0) {
      setView('subcategories');
    } else {
      // No sub-categories: show products for this category
      setView('products');
      await fetchServices({ category: category._id });
    }
  };

  const handleSubCategoryClick = async (subCat) => {
    setSelectedSubCategory(subCat);
    setServices([]);
    setView('products');
    await fetchServices({ subCategory: String(subCat._id) });
  };

  const handleBackToCategories = () => {
    setView('categories');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSubCategories([]);
    fetchServices();
  };

  const handleBackToSubCategories = () => {
    setView('subcategories');
    setSelectedSubCategory(null);
    if (selectedCategory) fetchSubCategories(selectedCategory._id);
  };

  return (
    <div className="eservices-container">
      <div className="eservices-header">
        <h1>{t('eservices.title')}</h1>
        <p className="eservices-subtitle">{t('eservices.subtitle')}</p>
        <div className="search-filter-section">
          <input
            type="text"
            placeholder={t('eservices.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">{t('eservices.loading')}</div>
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
                    <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat); }}>
                      {t('eservices.openCategory', 'Open')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'subcategories' && (
            <div className="subcategories-panel">
              <button className="back-btn" onClick={handleBackToCategories}>{t('eservices.backToCategories')}</button>
              <h2>{selectedCategory?.name}</h2>
              <div className="eservices-grid">
                {subCategories.map((sc, idx) => (
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
                      {Number(sc.order) > 0 && (
                        <div className="sub-order-badge">{sc.order}</div>
                      )}
                      <h3>{sc.name}</h3>
                      <p className="service-description">{sc.description}</p>
                      <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); handleSubCategoryClick(sc); }}>
                        {t('eservices.openSubCategory', 'Open')}
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
                <button className="back-btn" onClick={handleBackToSubCategories}>{t('eservices.backToSubcategories')}</button>
                <h2>{selectedSubCategory?.name}</h2>
              </div>
              <div className="eservices-grid">
                {services.map(service => (
                  <div key={service._id} className="service-card">
                    <div className="service-image-wrapper">
                      <img
                        src={primaryImageUrl(service.image)}
                        alt={service.name}
                        className="service-image"
                        data-fallback-idx="0"
                        onError={(e) => handleImageError(e, service.image)}
                        onContextMenu={blockImageActions}
                        onDragStart={blockImageActions}
                        draggable={false}
                      />
                      {service.discount > 0 && (
                        <div className="discount-badge">-{service.discount}%</div>
                      )}
                    </div>
                    <div className="service-content">
                      <h3>{service.name}</h3>
                      <p className="service-description">{service.description}</p>
                      <div className="service-pricing">
                        {service.discount > 0 ? (
                          <>
                            <span className="original-price">SYP {service.price.toFixed(2)}</span>
                            <span className="final-price">SYP {service.finalPrice.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="final-price">SYP {service.price.toFixed(2)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(service)}
                        className="add-to-cart-btn"
                      >
                        {t('eservices.subscribe')}
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

export default EServices;
