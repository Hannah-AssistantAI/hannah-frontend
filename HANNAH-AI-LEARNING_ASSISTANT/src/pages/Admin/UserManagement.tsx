import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, UserCheck, Filter } from 'lucide-react';
import AdminPageWrapper from './components/AdminPageWrapper';
import './UserManagement.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Faculty' | 'Admin';
  studentCode?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Mock data
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        role: 'Student',
        studentCode: 'SV001',
        status: 'Active',
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        name: 'Trần Thị B',
        email: 'tranthib@example.com',
        role: 'Faculty',
        status: 'Active',
        createdAt: '2024-01-10'
      },
      {
        id: '3',
        name: 'Lê Văn C',
        email: 'levanc@example.com',
        role: 'Admin',
        status: 'Active',
        createdAt: '2024-01-05'
      },
      {
        id: '4',
        name: 'Phạm Thị D',
        email: 'phamthid@example.com',
        role: 'Student',
        studentCode: 'SV002',
        status: 'Inactive',
        createdAt: '2024-01-20'
      }
    ];
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.studentCode && user.studentCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, searchTerm]);

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
        : user
    ));
  };

  return (
    <AdminPageWrapper title="Quản lý Người dùng">
      <div className="filters-section">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, mã sinh viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={16} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">Tất cả vai trò</option>
            <option value="Student">Sinh viên</option>
            <option value="Faculty">Giảng viên</option>
            <option value="Admin">Quản trị viên</option>
          </select>
        </div>
        <button
          className="btn btn-primary add-user-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Mã SV</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role === 'Student' ? 'Sinh viên' :
                     user.role === 'Faculty' ? 'Giảng viên' : 'Quản trị viên'}
                  </span>
                </td>
                <td>{user.studentCode || '-'}</td>
                <td>
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => setEditingUser(user)}
                      title="Chỉnh sửa"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn-icon btn-toggle"
                      onClick={() => handleToggleStatus(user.id)}
                      title={user.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      <UserCheck size={14} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-data">
          <p>Không tìm thấy người dùng nào</p>
        </div>
      )}

      {/* Create/Edit Form Modal - Placeholder */}
      {(showCreateForm || editingUser) && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h3>
            <p>Form sẽ được phát triển trong phiên bản tiếp theo</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default UserManagement;
