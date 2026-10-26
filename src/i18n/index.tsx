import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { ar, fr, en } from './sections/index';

export type Lang = 'ar' | 'fr' | 'en';

const dictionaries: Record<Lang, Record<string, string>> = { ar, fr, en };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, defaultValue?: string | Record<string, string | number>) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nCtx>(null!);

function translate(lang: Lang, key: string, defaultValue?: string | Record<string, string | number>): string {
  let val = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (defaultValue && typeof defaultValue === 'object') {
    for (const [k, v] of Object.entries(defaultValue)) {
      val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  } else if (typeof defaultValue === 'string') {
    if (val === key) val = defaultValue;
  }
  return val;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('crepettoo_lang');
    return (saved as Lang) || 'ar';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('crepettoo_lang', l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string, defaultValue?: string | Record<string, string | number>) => {
    return translate(lang, key, defaultValue);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
