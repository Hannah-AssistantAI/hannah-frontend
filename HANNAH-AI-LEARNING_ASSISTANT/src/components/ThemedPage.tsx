import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemedPage: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { theme } = useTheme();
  const cls = theme === 'dark' ? 'dark dark-theme' : 'theme-light';
  return (
    <div className={cls}>
      {children}
    </div>
  );
};

export default ThemedPage;
