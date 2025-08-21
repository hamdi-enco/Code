# Internationalization (i18n) Guide

## Overview

The Haramain platform provides comprehensive bilingual support for Arabic and English, with full right-to-left (RTL) and left-to-right (LTR) layout support, ensuring an optimal experience for all users.

## Technical Implementation

### 1. i18next Configuration

#### Core Setup
```typescript
// client/src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // English translations
      'hero.title': 'Book Your Journey with',
      'hero.titleHighlight': 'Haramain',
      'search.from': 'From',
      'search.to': 'To',
      // ... more translations
    }
  },
  ar: {
    translation: {
      // Arabic translations
      'hero.title': 'احجز رحلتك مع',
      'hero.titleHighlight': 'الحرمين',
      'search.from': 'من',
      'search.to': 'إلى',
      // ... more translations
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });
```

### 2. Language Context Provider

#### Context Implementation
```typescript
// client/src/contexts/LanguageContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  language: string;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const isRTL = language === 'ar';

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Update body class for CSS targeting
    document.body.className = isRTL ? 'rtl' : 'ltr';
  }, [isRTL, language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  const handleSetLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      isRTL,
      toggleLanguage,
      setLanguage: handleSetLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
```

## RTL/LTR Layout Support

### 1. CSS Configuration

#### Tailwind CSS RTL Support
```css
/* client/src/index.css */

/* RTL-specific styles */
.rtl {
  direction: rtl;
}

/* Custom RTL utilities */
.rtl .text-right {
  text-align: right;
}

.rtl .text-left {
  text-align: left;
}

/* Margin and padding adjustments for RTL */
.rtl .ml-auto {
  margin-left: 0;
  margin-right: auto;
}

.rtl .mr-auto {
  margin-right: 0;
  margin-left: auto;
}

/* Border radius adjustments */
.rtl .rounded-l-lg {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.rtl .rounded-r-lg {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
}
```

#### Tailwind Configuration for RTL
```typescript
// tailwind.config.ts
import { Config } from 'tailwindcss';

const config: Config = {
  content: ['./client/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'sans-serif'],
        'english': ['Inter', 'sans-serif']
      },
      colors: {
        'haramain-green': 'rgb(15, 81, 50)',
        'haramain-gold': 'rgb(218, 165, 32)'
      }
    }
  },
  plugins: [
    // RTL support plugin
    function({ addUtilities }) {
      addUtilities({
        '.rtl': {
          direction: 'rtl'
        },
        '.ltr': {
          direction: 'ltr'
        }
      });
    }
  ]
};

export default config;
```

### 2. Component-Level RTL Support

#### Language-Aware Components
```typescript
// Example: Navigation component with RTL support
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export function Navigation() {
  const { isRTL, toggleLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <nav className={`flex items-center justify-between p-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
        <img 
          src="/logo.png" 
          alt="Haramain" 
          className={`h-8 w-auto ${isRTL ? 'ml-4' : 'mr-4'}`} 
        />
        <h1 className="text-xl font-bold">{t('brand.name')}</h1>
      </div>
      
      <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
        <button
          onClick={toggleLanguage}
          className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          {isRTL ? 'English' : 'العربية'}
        </button>
      </div>
    </nav>
  );
}
```

#### Form Components with RTL
```typescript
// Search form with RTL support
export function SearchForm() {
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  return (
    <form className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {t('search.from')}
        </label>
        <select className={`w-full px-3 py-2 border rounded-md ${isRTL ? 'text-right' : 'text-left'}`}>
          <option value="">{t('search.selectCity')}</option>
          <option value="riyadh">{t('city.riyadh')}</option>
          <option value="jeddah">{t('city.jeddah')}</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {t('search.to')}
        </label>
        <select className={`w-full px-3 py-2 border rounded-md ${isRTL ? 'text-right' : 'text-left'}`}>
          <option value="">{t('search.selectCity')}</option>
          <option value="riyadh">{t('city.riyadh')}</option>
          <option value="jeddah">{t('city.jeddah')}</option>
        </select>
      </div>
      
      <button 
        type="submit"
        className={`
          bg-haramain-green text-white px-6 py-2 rounded-md
          ${isRTL ? 'font-arabic' : 'font-english'}
        `}
      >
        {t('search.searchButton')}
      </button>
    </form>
  );
}
```

## Translation Resources

### 1. Translation Structure

#### English Translations
```typescript
// English translation resource
const enTranslations = {
  // Brand and general
  'brand.name': 'Haramain',
  'brand.tagline': 'Your Journey, Our Mission',
  
  // Navigation
  'nav.home': 'Home',
  'nav.bookings': 'My Bookings',
  'nav.support': 'Support',
  'nav.login': 'Login',
  'nav.logout': 'Logout',
  
  // Hero section
  'hero.title': 'Book Your Journey with',
  'hero.titleHighlight': 'Haramain',
  'hero.subtitle': 'Comfortable, reliable bus travel across Saudi Arabia',
  
  // Search form
  'search.from': 'From',
  'search.to': 'To',
  'search.date': 'Departure Date',
  'search.returnDate': 'Return Date',
  'search.passengers': 'Passengers',
  'search.oneWay': 'One Way',
  'search.roundTrip': 'Round Trip',
  'search.searchButton': 'Search Buses',
  'search.selectCity': 'Select city',
  'search.availableBuses': 'Available Buses',
  
  // Cities
  'city.riyadh': 'Riyadh',
  'city.jeddah': 'Jeddah',
  'city.makkah': 'Makkah',
  'city.madinah': 'Madinah',
  'city.dammam': 'Dammam',
  
  // Trip details
  'trip.departure': 'Departure',
  'trip.arrival': 'Arrival',
  'trip.duration': 'Duration',
  'trip.price': 'Price',
  'trip.availableSeats': 'Available Seats',
  'trip.selectTrip': 'Select Trip',
  
  // Booking process
  'booking.selectSeats': 'Select Seats',
  'booking.passengerInfo': 'Passenger Information',
  'booking.payment': 'Payment',
  'booking.confirmation': 'Confirmation',
  'booking.reference': 'Booking Reference',
  'booking.confirmed': 'Booking Confirmed',
  'booking.successMessage': 'Your ticket has been booked successfully!',
  
  // Payment
  'payment.securePayment': 'Secure Payment',
  'payment.cardDetails': 'Card Details',
  'payment.payNow': 'Pay Now',
  'payment.processing': 'Processing...',
  'payment.total': 'Total',
  'payment.bookingSummary': 'Booking Summary',
  
  // Dashboard
  'dashboard.upcomingTrips': 'Upcoming Trips',
  'dashboard.tripHistory': 'Trip History',
  'dashboard.confirmed': 'Confirmed',
  'dashboard.pending': 'Pending',
  'dashboard.cancelled': 'Cancelled',
  
  // Currency
  'currency.sar': 'SAR',
  
  // Time formats
  'time.am': 'AM',
  'time.pm': 'PM',
  
  // Common actions
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.success': 'Success',
  
  // Footer
  'footer.aboutUs': 'About Us',
  'footer.contactUs': 'Contact Us',
  'footer.termsOfService': 'Terms of Service',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.followUs': 'Follow Us',
  'footer.copyright': '© 2025 Haramain. All rights reserved.'
};
```

#### Arabic Translations
```typescript
// Arabic translation resource
const arTranslations = {
  // Brand and general
  'brand.name': 'الحرمين',
  'brand.tagline': 'رحلتك، مهمتنا',
  
  // Navigation
  'nav.home': 'الرئيسية',
  'nav.bookings': 'حجوزاتي',
  'nav.support': 'الدعم',
  'nav.login': 'تسجيل الدخول',
  'nav.logout': 'تسجيل الخروج',
  
  // Hero section
  'hero.title': 'احجز رحلتك مع',
  'hero.titleHighlight': 'الحرمين',
  'hero.subtitle': 'سفر مريح وموثوق بالحافلات عبر المملكة العربية السعودية',
  
  // Search form
  'search.from': 'من',
  'search.to': 'إلى',
  'search.date': 'تاريخ المغادرة',
  'search.returnDate': 'تاريخ العودة',
  'search.passengers': 'المسافرون',
  'search.oneWay': 'ذهاب فقط',
  'search.roundTrip': 'ذهاب وعودة',
  'search.searchButton': 'البحث عن الحافلات',
  'search.selectCity': 'اختر المدينة',
  'search.availableBuses': 'الحافلات المتاحة',
  
  // Cities
  'city.riyadh': 'الرياض',
  'city.jeddah': 'جدة',
  'city.makkah': 'مكة المكرمة',
  'city.madinah': 'المدينة المنورة',
  'city.dammam': 'الدمام',
  
  // Trip details
  'trip.departure': 'المغادرة',
  'trip.arrival': 'الوصول',
  'trip.duration': 'المدة',
  'trip.price': 'السعر',
  'trip.availableSeats': 'المقاعد المتاحة',
  'trip.selectTrip': 'اختر الرحلة',
  
  // Booking process
  'booking.selectSeats': 'اختيار المقاعد',
  'booking.passengerInfo': 'معلومات المسافر',
  'booking.payment': 'الدفع',
  'booking.confirmation': 'التأكيد',
  'booking.reference': 'رقم الحجز',
  'booking.confirmed': 'تم تأكيد الحجز',
  'booking.successMessage': 'تم حجز تذكرتك بنجاح!',
  
  // Payment
  'payment.securePayment': 'دفع آمن',
  'payment.cardDetails': 'تفاصيل البطاقة',
  'payment.payNow': 'ادفع الآن',
  'payment.processing': 'جاري المعالجة...',
  'payment.total': 'الإجمالي',
  'payment.bookingSummary': 'ملخص الحجز',
  
  // Dashboard
  'dashboard.upcomingTrips': 'الرحلات القادمة',
  'dashboard.tripHistory': 'تاريخ الرحلات',
  'dashboard.confirmed': 'مؤكد',
  'dashboard.pending': 'قيد الانتظار',
  'dashboard.cancelled': 'ملغي',
  
  // Currency
  'currency.sar': 'ر.س',
  
  // Time formats
  'time.am': 'ص',
  'time.pm': 'م',
  
  // Common actions
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.edit': 'تعديل',
  'common.delete': 'حذف',
  'common.confirm': 'تأكيد',
  'common.back': 'رجوع',
  'common.next': 'التالي',
  'common.loading': 'جاري التحميل...',
  'common.error': 'حدث خطأ',
  'common.success': 'نجح',
  
  // Footer
  'footer.aboutUs': 'من نحن',
  'footer.contactUs': 'اتصل بنا',
  'footer.termsOfService': 'شروط الخدمة',
  'footer.privacyPolicy': 'سياسة الخصوصية',
  'footer.followUs': 'تابعنا',
  'footer.copyright': '© 2025 الحرمين. جميع الحقوق محفوظة.'
};
```

### 2. Translation Management

#### Dynamic Translation Loading
```typescript
// Lazy load translations for better performance
const loadTranslations = async (language: string) => {
  try {
    const translations = await import(`../locales/${language}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    return {};
  }
};

// Add translations dynamically
i18n.addResourceBundle('en', 'translation', await loadTranslations('en'));
i18n.addResourceBundle('ar', 'translation', await loadTranslations('ar'));
```

#### Translation Validation
```typescript
// Validate that all required translations exist
const validateTranslations = (translations: Record<string, any>) => {
  const requiredKeys = [
    'hero.title',
    'search.from',
    'search.to',
    'booking.confirmed',
    // ... other required keys
  ];
  
  const missingKeys = requiredKeys.filter(key => !translations[key]);
  
  if (missingKeys.length > 0) {
    console.warn('Missing translation keys:', missingKeys);
  }
  
  return missingKeys.length === 0;
};
```

## Date and Number Formatting

### 1. Locale-Aware Formatting

#### Date Formatting
```typescript
// Locale-aware date formatting
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function formatDate(date: Date, language: string): string {
  const locale = language === 'ar' ? ar : enUS;
  
  if (language === 'ar') {
    // Arabic date format: DD/MM/YYYY
    return format(date, 'dd/MM/yyyy', { locale });
  } else {
    // English date format: MM/DD/YYYY
    return format(date, 'MM/dd/yyyy', { locale });
  }
}

export function formatTime(date: Date, language: string): string {
  const locale = language === 'ar' ? ar : enUS;
  
  return format(date, 'HH:mm', { locale });
}

// Usage in components
function TripCard({ trip }: { trip: Trip }) {
  const { language } = useLanguage();
  
  return (
    <div>
      <p>{formatDate(trip.departureTime, language)}</p>
      <p>{formatTime(trip.departureTime, language)}</p>
    </div>
  );
}
```

#### Number and Currency Formatting
```typescript
// Currency formatting with proper locale
export function formatCurrency(amount: number, language: string): string {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

// Number formatting
export function formatNumber(number: number, language: string): string {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  
  return new Intl.NumberFormat(locale).format(number);
}

// Usage
function PriceDisplay({ price }: { price: number }) {
  const { language } = useLanguage();
  
  return (
    <span className="font-semibold">
      {formatCurrency(price, language)}
    </span>
  );
}
```

## Translation Hooks and Utilities

### 1. Custom Translation Hooks

#### Enhanced Translation Hook
```typescript
// Enhanced useTranslation hook with additional features
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();
  const { language, isRTL } = useLanguage();
  
  // Enhanced translation function with fallbacks
  const translate = (key: string, options?: any) => {
    const translation = t(key, options);
    
    // Return key if translation is missing in development
    if (process.env.NODE_ENV === 'development' && translation === key) {
      console.warn(`Missing translation for key: ${key}`);
    }
    
    return translation;
  };
  
  // Format currency with current language
  const formatCurrency = (amount: number) => {
    return formatCurrency(amount, language);
  };
  
  // Format date with current language
  const formatDate = (date: Date) => {
    return formatDate(date, language);
  };
  
  return {
    t: translate,
    language,
    isRTL,
    formatCurrency,
    formatDate,
    changeLanguage: i18n.changeLanguage
  };
}
```

#### City Name Translation Hook
```typescript
// Specialized hook for city name translations
export function useCityTranslation() {
  const { t } = useTranslation();
  
  const getCityName = (cityKey: string): string => {
    return t(`city.${cityKey}`, cityKey); // Fallback to key if translation missing
  };
  
  const getRouteName = (originCity: string, destinationCity: string): string => {
    return `${getCityName(originCity)} → ${getCityName(destinationCity)}`;
  };
  
  return {
    getCityName,
    getRouteName
  };
}
```

### 2. Translation Utilities

#### Translation Helper Functions
```typescript
// Utility functions for translations
export const translationUtils = {
  // Check if a translation key exists
  hasTranslation: (key: string, language: string): boolean => {
    return i18n.exists(key, { lng: language });
  },
  
  // Get translation in specific language
  getTranslation: (key: string, language: string): string => {
    return i18n.t(key, { lng: language });
  },
  
  // Get all translations for a namespace
  getNamespaceTranslations: (namespace: string): Record<string, string> => {
    return i18n.getResourceBundle(i18n.language, namespace) || {};
  },
  
  // Pluralization helper
  getPlural: (key: string, count: number): string => {
    return i18n.t(key, { count });
  }
};

// Usage in components
const { hasTranslation, getPlural } = translationUtils;

function SeatCount({ count }: { count: number }) {
  return (
    <span>
      {getPlural('seat', count)} {/* "1 seat" or "2 seats" */}
    </span>
  );
}
```

## Performance Optimization

### 1. Translation Loading Optimization

#### Namespace Splitting
```typescript
// Split translations by feature for better loading
const namespaces = {
  common: ['navigation', 'footer', 'common'],
  booking: ['search', 'booking', 'payment'],
  dashboard: ['dashboard', 'profile'],
  admin: ['admin', 'analytics']
};

// Load only required namespaces
export function loadNamespace(namespace: string) {
  return i18n.loadNamespaces(namespace);
}

// Component-level namespace loading
function BookingPage() {
  const { ready } = useTranslation(['booking', 'common']);
  
  if (!ready) {
    return <div>Loading translations...</div>;
  }
  
  return <BookingForm />;
}
```

#### Translation Caching
```typescript
// Cache translations in localStorage
const translationCache = {
  set: (language: string, translations: any) => {
    localStorage.setItem(`translations_${language}`, JSON.stringify(translations));
  },
  
  get: (language: string) => {
    const cached = localStorage.getItem(`translations_${language}`);
    return cached ? JSON.parse(cached) : null;
  },
  
  clear: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('translations_'))
      .forEach(key => localStorage.removeItem(key));
  }
};
```

### 2. Component-Level Optimization

#### Memoized Translation Components
```typescript
// Memoize components that use translations
const TranslatedText = memo(function TranslatedText({ 
  tKey, 
  className 
}: { 
  tKey: string; 
  className?: string;
}) {
  const { t } = useTranslation();
  
  return (
    <span className={className}>
      {t(tKey)}
    </span>
  );
});

// Usage
<TranslatedText tKey="hero.title" className="text-2xl font-bold" />
```

## Testing Internationalization

### 1. Translation Testing

#### Translation Key Testing
```typescript
// Test that all required translation keys exist
describe('Translations', () => {
  const requiredKeys = [
    'hero.title',
    'search.from',
    'search.to',
    'booking.confirmed'
  ];
  
  test('all required English translations exist', () => {
    requiredKeys.forEach(key => {
      expect(i18n.exists(key, { lng: 'en' })).toBe(true);
    });
  });
  
  test('all required Arabic translations exist', () => {
    requiredKeys.forEach(key => {
      expect(i18n.exists(key, { lng: 'ar' })).toBe(true);
    });
  });
  
  test('English and Arabic have same translation keys', () => {
    const enKeys = Object.keys(i18n.getResourceBundle('en', 'translation'));
    const arKeys = Object.keys(i18n.getResourceBundle('ar', 'translation'));
    
    expect(enKeys.sort()).toEqual(arKeys.sort());
  });
});
```

#### RTL Layout Testing
```typescript
// Test RTL layout rendering
describe('RTL Layout', () => {
  test('applies RTL class when Arabic is selected', () => {
    render(
      <LanguageProvider>
        <App />
      </LanguageProvider>
    );
    
    // Switch to Arabic
    fireEvent.click(screen.getByText('العربية'));
    
    // Check if RTL class is applied
    expect(document.body).toHaveClass('rtl');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
  
  test('removes RTL class when English is selected', () => {
    render(
      <LanguageProvider>
        <App />
      </LanguageProvider>
    );
    
    // Switch to English
    fireEvent.click(screen.getByText('English'));
    
    // Check if LTR is applied
    expect(document.body).toHaveClass('ltr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
```

## Content Management

### 1. Translation Management Workflow

#### Translation File Structure
```
locales/
├── en/
│   ├── common.json          # Common translations
│   ├── navigation.json      # Navigation items
│   ├── booking.json         # Booking process
│   ├── payment.json         # Payment related
│   └── dashboard.json       # User dashboard
└── ar/
    ├── common.json          # Arabic common translations
    ├── navigation.json      # Arabic navigation
    ├── booking.json         # Arabic booking
    ├── payment.json         # Arabic payment
    └── dashboard.json       # Arabic dashboard
```

#### Translation Review Process
```typescript
// Translation validation script
const validateTranslations = () => {
  const languages = ['en', 'ar'];
  const namespaces = ['common', 'navigation', 'booking'];
  
  const issues: string[] = [];
  
  languages.forEach(lang => {
    namespaces.forEach(ns => {
      const translations = loadTranslationFile(lang, ns);
      
      // Check for missing keys
      const requiredKeys = getRequiredKeys(ns);
      const missingKeys = requiredKeys.filter(key => !translations[key]);
      
      if (missingKeys.length > 0) {
        issues.push(`Missing keys in ${lang}/${ns}: ${missingKeys.join(', ')}`);
      }
      
      // Check for empty translations
      Object.entries(translations).forEach(([key, value]) => {
        if (!value || value.toString().trim() === '') {
          issues.push(`Empty translation: ${lang}/${ns}/${key}`);
        }
      });
    });
  });
  
  return issues;
};
```

### 2. Dynamic Content Translation

#### API Response Translation
```typescript
// Handle translated content from API
interface TranslatableContent {
  en: string;
  ar: string;
}

interface APIResponse {
  title: TranslatableContent;
  description: TranslatableContent;
}

function useTranslatedContent<T extends Record<string, TranslatableContent>>(
  content: T
): Record<keyof T, string> {
  const { language } = useLanguage();
  
  return useMemo(() => {
    const translatedContent: Record<string, string> = {};
    
    Object.entries(content).forEach(([key, value]) => {
      translatedContent[key] = value[language as keyof TranslatableContent] || value.en;
    });
    
    return translatedContent as Record<keyof T, string>;
  }, [content, language]);
}

// Usage
function ContentDisplay({ apiData }: { apiData: APIResponse }) {
  const { title, description } = useTranslatedContent(apiData);
  
  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
```

This comprehensive internationalization implementation ensures that the Haramain platform provides an authentic, culturally appropriate experience for both Arabic and English users, with proper RTL support and locale-aware formatting throughout the application.