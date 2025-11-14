import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label="Chuyển đổi chế độ sáng/tối"
      title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-[1000] inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-100 shadow-lg hover:shadow-xl transition-shadow w-12 h-12 backdrop-blur"
    >
      {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
};

export default ThemeToggle;
