import React from 'react';
import '../styles/Home.css';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{t('home.welcome')}</h1>
          <p className="hero-subtitle">{t('home.subtitle')}</p>
          <p className="hero-description">{t('home.description')}</p>
          <a href="/products" className="cta-button">{t('home.shopNow')}</a>
        </div>
        <div className="hero-image">
          <img src={logo} alt="My Stickies" className="hero-logo" />
        </div>
      </section>

      <section className="features-section">
        <h2>{t('home.whyTitle')}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>{t('home.fastDelivery')}</h3>
            <p>{t('home.subtitle')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>{t('home.highQuality')}</h3>
            <p>{t('home.description')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎁</div>
            <h3>{t('home.greatSelection')}</h3>
            <p>{t('home.subtitle')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>{t('home.support')}</h3>
            <p>{t('home.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>{t('home.ctaTitle')}</h2>
        <a href="/products" className="cta-button-secondary">{t('home.explore')}</a>
      </section>
    </div>
  );
};

export default Home;
