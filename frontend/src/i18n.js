import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
  en: { translation: translationEN },
  ar: { translation: translationAR }
};

const savedLang = 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    // Make Arabic the primary/fallback language
    fallbackLng: 'ar',
    interpolation: { escapeValue: false }
  });

export default i18n;
