import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  'neon-quantum': {
    id: 'neon-quantum',
    name: 'Neon Quantum — Blue & Purple',
    shortName: 'Neon Quantum',
    tag: 'Futuristic AI & Crypto',
    description: 'Deep midnight-blue background with electric blue, violet, and subtle magenta gradients. Glassmorphism cards with fine luminous borders.',
    bg: '#050720',
    cardBg: '#111B57',
    accent: '#7C3AED',
    secondaryAccent: '#4169FF',
    previewColors: ['#050720', '#10164A', '#4169FF', '#7C3AED', '#EC4899'],
    isDark: true,
  },
  'clean-minimal': {
    id: 'clean-minimal',
    name: 'Clean Minimal — White & Blue',
    shortName: 'Clean Minimal',
    tag: 'Modern Everyday Banking',
    description: 'Clean white and very light blue backgrounds with royal blue primary controls, crisp dark navy text, and soft subtle shadows.',
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    accent: '#2563EB',
    secondaryAccent: '#3B82F6',
    previewColors: ['#F8FAFC', '#FFFFFF', '#2563EB', '#60A5FA', '#0F172A'],
    isDark: false,
  },
  'cyber-emerald': {
    id: 'cyber-emerald',
    name: 'Cyber Emerald — Black & Teal',
    shortName: 'Cyber Emerald',
    tag: 'Stealth Cryptographic Ledger',
    description: 'Deep black and dark teal matrix with vivid emerald and turquoise accents. Sophisticated glass cards with refined teal ambient lighting.',
    bg: '#030708',
    cardBg: '#0B1F24',
    accent: '#10B981',
    secondaryAccent: '#06B6D4',
    previewColors: ['#030708', '#08161B', '#10B981', '#06B6D4', '#14B8A6'],
    isDark: true,
  }
};

export const FONTS = {
  'Inter': {
    id: 'Inter',
    name: 'Inter',
    description: 'Geometric & hyper-legible modern fintech default with balanced numerals.',
    sample: '₹4,892,150.00 • ECDSA Verified P-256'
  },
  'Poppins': {
    id: 'Poppins',
    name: 'Poppins',
    description: 'Contemporary rounded geometric typography with striking modern headings.',
    sample: '₹4,892,150.00 • ECDSA Verified P-256'
  },
  'Roboto': {
    id: 'Roboto',
    name: 'Roboto',
    description: 'Structured, highly legible mechanical curves trusted by enterprise platforms.',
    sample: '₹4,892,150.00 • ECDSA Verified P-256'
  }
};

const ThemeContext = createContext({
  theme: 'neon-quantum',
  adminTheme: 'neon-quantum',
  activeTheme: 'neon-quantum',
  font: 'Inter',
  adminFont: 'Inter',
  activeFont: 'Inter',
  isAdminRoute: false,
  setTheme: () => {},
  setAdminTheme: () => {},
  setFont: () => {},
  setAdminFont: () => {},
  resetDefaults: () => {},
  themes: THEMES,
  fonts: FONTS
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('vc_theme') || 'neon-quantum';
  });

  const [adminTheme, setAdminThemeState] = useState(() => {
    return localStorage.getItem('vc_admin_theme') || localStorage.getItem('vc_theme') || 'neon-quantum';
  });

  const [font, setFontState] = useState(() => {
    return localStorage.getItem('vc_font') || 'Inter';
  });

  const [adminFont, setAdminFontState] = useState(() => {
    return localStorage.getItem('vc_admin_font') || localStorage.getItem('vc_font') || 'Inter';
  });

  const getIsAdminRoute = () => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  };

  const [isAdminRoute, setIsAdminRoute] = useState(getIsAdminRoute);

  useEffect(() => {
    const handleLocationCheck = () => {
      setIsAdminRoute(getIsAdminRoute());
    };
    window.addEventListener('popstate', handleLocationCheck);
    const interval = setInterval(handleLocationCheck, 200);
    return () => {
      window.removeEventListener('popstate', handleLocationCheck);
      clearInterval(interval);
    };
  }, []);

  const currentTheme = isAdminRoute ? adminTheme : theme;
  const currentFont = isAdminRoute ? adminFont : font;

  // Apply theme & font to root document element
  useEffect(() => {
    const validTheme = THEMES[currentTheme] ? currentTheme : 'neon-quantum';
    const validFont = FONTS[currentFont] ? currentFont : 'Inter';

    document.documentElement.setAttribute('data-theme', validTheme);
    document.documentElement.setAttribute('data-font', validFont);

    window.dispatchEvent(new CustomEvent('vaultchain-theme-change', {
      detail: { theme: validTheme, isAdmin: isAdminRoute }
    }));
    window.dispatchEvent(new CustomEvent('vaultchain-font-change', {
      detail: { font: validFont, isAdmin: isAdminRoute }
    }));
  }, [currentTheme, currentFont, isAdminRoute]);

  const setTheme = (newTheme) => {
    if (THEMES[newTheme]) {
      setThemeState(newTheme);
      localStorage.setItem('vc_theme', newTheme);
    }
  };

  const setAdminTheme = (newTheme) => {
    if (THEMES[newTheme]) {
      setAdminThemeState(newTheme);
      localStorage.setItem('vc_admin_theme', newTheme);
    }
  };

  const setFont = (newFont) => {
    if (FONTS[newFont]) {
      setFontState(newFont);
      localStorage.setItem('vc_font', newFont);
    }
  };

  const setAdminFont = (newFont) => {
    if (FONTS[newFont]) {
      setAdminFontState(newFont);
      localStorage.setItem('vc_admin_font', newFont);
    }
  };

  const resetDefaults = (forAdmin = false) => {
    if (forAdmin) {
      setAdminThemeState('neon-quantum');
      setAdminFontState('Inter');
      localStorage.removeItem('vc_admin_theme');
      localStorage.removeItem('vc_admin_font');
    } else {
      setThemeState('neon-quantum');
      setFontState('Inter');
      localStorage.setItem('vc_theme', 'neon-quantum');
      localStorage.setItem('vc_font', 'Inter');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme, // provides active theme for compatibility
        userTheme: theme,
        adminTheme,
        activeTheme: currentTheme,
        font: currentFont,
        userFont: font,
        adminFont,
        activeFont: currentFont,
        isAdminRoute,
        setTheme,
        setAdminTheme,
        setFont,
        setAdminFont,
        resetDefaults,
        themes: THEMES,
        fonts: FONTS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
