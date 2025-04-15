import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();
  
  return (
    <footer 
      className={`w-full mt-auto ${
        theme === 'dark' 
          ? 'bg-slate-900 bg-grid-dark' 
          : 'bg-slate-50 bg-grid-light'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="pt-16 pb-12 md:pl-6">
          <h2 
            className={`text-xl font-light mb-4 font-['Poppins',sans-serif] tracking-tight leading-tight letter-spacing-[-0.02em] ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
            }`}
            style={{ letterSpacing: '-0.02em', fontStretch: 'condensed' }}
          >
            Track Your Study efficiently.
          </h2>
          
          <div className="flex items-center text-xs">
            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Developed with
            </span>
            <span className="mx-1 text-rose-500">❤️</span>
            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              by
            </span>
            <a 
              href="https://brandupcreatives.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`ml-1 font-medium ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:text-primary' 
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              brandupcreatives.in
            </a>
            <span className="mx-1 text-amber-500">👋</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 