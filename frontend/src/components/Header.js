import React from 'react';
import '../styles/Header.css';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';

const Header = ({ cartCount }) => {
  const { t } = useTranslation();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src={logo} alt="My Stickies Logo" className="logo-img" />
        </div>
        <nav className="nav">
          <a href="/" className="nav-link">{t('header.home')}</a>
          <a href="/products" className="nav-link">{t('header.products')}</a>
          <a href="/e-services" className="nav-link">{t('header.eservices')}</a>
          <a href="/cart" className="nav-link cart-link">
            {t('header.cart')}
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
