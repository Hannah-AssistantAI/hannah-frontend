import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './components/Sidebar';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
