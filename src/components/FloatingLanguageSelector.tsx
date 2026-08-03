import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import type { Language } from '../context/AppStateContext';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
  { code: 'ceb', label: 'Cebuano', flag: '🇵🇭' },
  { code: 'hil', label: 'Hiligaynon', flag: '🇵🇭' },
];

export const FloatingLanguageSelector: React.FC = () => {
  const { language, setLanguage } = useAppState();
  const [open, setOpen] = useState(false);

  const current = languages.find(l => l.code === language) ?? languages[0];

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/60 text-slate-800 font-semibold text-sm hover:bg-white transition-all"
      >
        <Globe className="w-4 h-4 text-teal-600 shrink-0" />
        <span>{current.flag} {current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors hover:bg-teal-50 ${language === lang.code ? 'text-teal-700 font-bold bg-teal-50/60' : 'text-slate-700'}`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
              {language === lang.code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
