import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import FacultySidebar from './components/Sidebar';
import { FacultyProvider } from '../../contexts/FacultyContext';
import './FacultyLayout.css';

const FacultyLayout: React.FC = () => {
  // Force light theme for Faculty pages
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <FacultyProvider>
      <div className="faculty-layout">
        <FacultySidebar />
        <main className="faculty-content">
          <Outlet />
        </main>
      </div>
    </FacultyProvider>
  );
};

export default FacultyLayout;
