import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import '../styles/EServices.css';

const EServices = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
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
      const params = { type: 'eservice' };

      const response = await api.get('/products', { params });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const getCategoryIcon = (category) => {
    const slug = (category?.slug || '').toLowerCase();
    if (slug.includes('logo') || slug.includes('design')) return '🎨';
    if (slug.includes('app') || slug.includes('subscription')) return '📱';
    if (slug.includes('social') || slug.includes('media')) return '🌐';
    if (slug.includes('video') || slug.includes('edit')) return '🎬';
    if (slug.includes('marketing') || slug.includes('ads')) return '📣';
    return '💻';
  };

  const categoryImageUrl = (category) => {
    const image = (category?.image || '').trim();
    if (!image) return '';
    return primaryImageUrl(image);
  };

  const selectedCategoryData = categories.find(cat => cat.slug === selectedCategory);
  const filteredServices = selectedCategory
    ? services.filter(service => service.category?.slug === selectedCategory)
    : [];

  return (
    <div className="eservices-container">
      <div className="eservices-header">
        <h1>{t('eservices.title')}</h1>
        <p className="eservices-subtitle">{t('eservices.subtitle')}</p>
        {selectedCategory && (
          <button
            type="button"
            className="back-to-categories"
            onClick={() => setSelectedCategory('')}
          >
            {t('eservices.backToCategories')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner">{t('eservices.loading')}</div>
      ) : selectedCategory ? (
        filteredServices.length === 0 ? (
          <div className="no-services">{t('eservices.noServices')}</div>
        ) : (
          <div className="category-sections">
            <section className="category-section">
              <div className="category-header">
                <h2>{selectedCategoryData?.name || ''}</h2>
              </div>
              <div className="eservices-grid">
                {filteredServices.map(service => (
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
          </div>
        )
      ) : categories.length === 0 ? (
        <div className="no-services">{t('eservices.noServices')}</div>
      ) : (
        <div className="eservice-categories-grid">
          {categories.map(category => {
            const count = services.filter(service => service.category?.slug === category.slug).length;
            const imageUrl = categoryImageUrl(category);
            return (
              <button
                key={category._id}
                type="button"
                className="eservice-category-card"
                onClick={() => setSelectedCategory(category.slug)}
              >
                {imageUrl ? (
                  <div className="category-image-wrapper">
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="category-image"
                      data-fallback-idx="0"
                      onError={(e) => handleImageError(e, category.image)}
                    />
                  </div>
                ) : (
                  <div className="category-icon">{getCategoryIcon(category)}</div>
                )}
                <h3>{category.name}</h3>
                <p className="category-count">{count} {t('eservices.servicesCount')}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EServices;
