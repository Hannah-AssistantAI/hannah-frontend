import React from 'react';
import { Outlet } from 'react-router-dom';
import FacultySidebar from './components/Sidebar';
import { FacultyProvider } from '../../contexts/FacultyContext';
import './FacultyLayout.css';

const FacultyLayout: React.FC = () => {
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
