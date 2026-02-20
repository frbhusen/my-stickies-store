import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import '../styles/EServices.css';

const EServices = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
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
      const response = await api.get('/categories?type=eservice');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      let params = { type: 'eservice' };
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/products', { params });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

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
      ) : services.length === 0 ? (
        <div className="no-services">{t('eservices.noServices')}</div>
      ) : (
        <div className="category-sections">
          {categories.map(category => {
            const categoryServices = services.filter(service => service.category?.slug === category.slug);
            if (categoryServices.length === 0) return null;
            return (
              <section key={category._id} className="category-section">
                <div className="category-header">
                  <h2>{category.name}</h2>
                </div>
                <div className="eservices-grid">
                  {categoryServices.map(service => (
                    <div key={service._id} className="service-card">
                      <div className="service-image-wrapper">
                        <img
                          src={primaryImageUrl(service.image)}
                          alt={service.name}
                          className="service-image"
                          data-fallback-idx="0"
                          onError={(e) => handleImageError(e, service.image)}
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
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EServices;
