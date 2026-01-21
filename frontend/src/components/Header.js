import React from 'react';
import '../styles/Header.css';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';

const Header = ({ cartCount }) => {
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('appLang', next);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src={logo} alt="My Stickies Logo" className="logo-img" />
        </div>
        <nav className="nav">
          <a href="/" className="nav-link">{t('header.home')}</a>
          <a href="/products" className="nav-link">{t('header.products')}</a>
          <a href="/cart" className="nav-link cart-link">
            {t('header.cart')}
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </a>
          <button onClick={toggleLang} className="lang-btn">{t('header.language')}</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
