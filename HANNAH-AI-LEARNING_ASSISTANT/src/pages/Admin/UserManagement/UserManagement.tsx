import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Search, Filter, Download, Upload, Pencil, Power, Trash2, UserPlus, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import './UserManagement.css';
import { parseUsersFromFile, type ParsedResult } from '../../../utils/userImport';
import userService, { type User } from '../../../service/userService';
import ImportPreviewModal from './modals/ImportPreviewModal';
import EditUserModal from './modals/EditUserModal';
import CreateFormModal from './modals/CreateFormModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import DeactivateConfirmationModal from './modals/DeactivateConfirmationModal';
import { formatDateVN } from '../../../utils/dateUtils';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    role: ''
  });
  const [importResult, setImportResult] = useState<ParsedResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  type Toast = { id: number; type: 'success' | 'error' | 'info'; message: string };
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const t = { id, ...toast } as Toast;
    setToasts((prev) => [t, ...prev]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 2500);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await userService.getAllUsers();
      setAllUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      addToast({ type: 'error', message: 'Failed to load user data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let usersToFilter = [...allUsers];

    if (roleFilter) {
      usersToFilter = usersToFilter.filter(user => user.role.toLowerCase() === roleFilter.toLowerCase());
    }

    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      usersToFilter = usersToFilter.filter(user =>
        user.fullName.toLowerCase().includes(lowercasedSearch) ||
        user.email.toLowerCase().includes(lowercasedSearch) ||
        user.username.toLowerCase().includes(lowercasedSearch)
      );
    }

    setFilteredUsers(usersToFilter);
  }, [searchTerm, roleFilter, allUsers]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSelectedFileName(file.name);

    try {
      const result = await parseUsersFromFile(file);
      setImportResult(result);
      setShowImportModal(true);
    } catch (err) {
      alert('Cannot read the file. Please check the format (Excel/CSV) and try again.');
      console.error(err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await userService.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Template downloaded successfully.' });
    } catch (error) {
      console.error('Failed to download template:', error);
      addToast({ type: 'error', message: 'Failed to download template.' });
    }
  };

  const applyImport = async () => {
    if (!selectedFile) {
      addToast({ type: 'error', message: 'No file selected for import.' });
      return;
    }

    try {
      const result = await userService.importFaculty(selectedFile);
      addToast({ type: 'success', message: `${result.importedCount} users imported successfully!` });
      setShowImportModal(false);
      setSelectedFile(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to import users:', error);
      addToast({ type: 'error', message: 'Failed to import users. Please check the file and try again.' });
    }
  };

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');

  const requestDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.userId.toString());
      addToast({ type: 'success', message: `User ${userToDelete.fullName} deleted successfully.` });
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      addToast({ type: 'error', message: 'Failed to delete user.' });
    }
  };

  const cancelDeleteUser = () => setUserToDelete(null);

  const confirmDeactivateUser = async () => {
    if (deactivationReason.trim() === '') {
      addToast({ type: 'error', message: 'Please enter a reason to disable.' });
      return;
    }

    if (!userToDeactivate) return;
    try {
      await userService.deactivateUser(userToDeactivate.userId.toString(), deactivationReason);
      addToast({ type: 'success', message: `User ${userToDeactivate.fullName} has been deactivated.` });
      setUserToDeactivate(null);
      setDeactivationReason('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      addToast({ type: 'error', message: 'Failed to deactivate user.' });
    }
  };

  const cancelDeactivateUser = () => {
    setUserToDeactivate(null);
    setDeactivationReason('');
  };

  const handleToggleStatus = async (user: User) => {
    if (user.isActive) {
      setUserToDeactivate(user);
    } else {
      try {
        await userService.activateUser(user.userId.toString());
        addToast({ type: 'success', message: `User ${user.fullName} has been activated.` });
        fetchUsers();
      } catch (error) {
        console.error('Failed to activate user:', error);
        addToast({ type: 'error', message: 'Failed to activate user.' });
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;

    if (!editFormData.fullName.trim()) {
      addToast({ type: 'error', message: 'Full name is required.' });
      return;
    }
    if (!editFormData.email.trim()) {
      addToast({ type: 'error', message: 'Email is required.' });
      return;
    }
    if (!editFormData.role) {
      addToast({ type: 'error', message: 'Role is required.' });
      return;
    }

    try {
      await userService.updateUser(editingUser.userId.toString(), {
        fullName: editFormData.fullName,
        email: editFormData.email,
        role: editFormData.role
      });
      addToast({ type: 'success', message: `User ${editFormData.fullName} has been updated.` });
      setEditingUser(null);
      setEditFormData({ fullName: '', email: '', role: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      addToast({ type: 'error', message: 'Failed to update user.' });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({ fullName: '', email: '', role: '' });
  };

  // Statistics
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u.isActive).length;
  const studentCount = allUsers.filter(u => u.role.toLowerCase() === 'student').length;
  const facultyCount = allUsers.filter(u => u.role.toLowerCase() === 'faculty').length;

  return (
    <AdminPageWrapper title="User Management">
      {/* Toast notifications */}
      <div className="um-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`um-toast um-toast-${t.type}`}>
            <div className="um-toast-icon">
              {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />}
            </div>
            <div className="um-toast-message">{t.message}</div>
          </div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="um-stats-grid">
        <div className="um-stat-card um-stat-total">
          <div className="um-stat-icon">
            <Users size={24} />
          </div>
          <div className="um-stat-content">
            <span className="um-stat-value">{totalUsers}</span>
            <span className="um-stat-label">Total Users</span>
          </div>
        </div>
        <div className="um-stat-card um-stat-active">
          <div className="um-stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="um-stat-content">
            <span className="um-stat-value">{activeUsers}</span>
            <span className="um-stat-label">Active</span>
          </div>
        </div>
        <div className="um-stat-card um-stat-students">
          <div className="um-stat-icon">
            <UserPlus size={24} />
          </div>
          <div className="um-stat-content">
            <span className="um-stat-value">{studentCount}</span>
            <span className="um-stat-label">Students</span>
          </div>
        </div>
        <div className="um-stat-card um-stat-faculty">
          <div className="um-stat-icon">
            <Users size={24} />
          </div>
          <div className="um-stat-content">
            <span className="um-stat-value">{facultyCount}</span>
            <span className="um-stat-label">Faculty</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="um-filters">
        <div className="um-search-wrapper">
          <Search className="um-search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-search-input"
          />
        </div>
        <div className="um-filter-wrapper">
          <Filter className="um-filter-icon" size={18} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="um-filter-select"
          >
            <option value="">All Roles</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="um-actions">
          <button className="um-btn um-btn-outline" onClick={handleDownloadTemplate}>
            <Download size={16} />
            <span>Download Template</span>
          </button>
          <button className="um-btn um-btn-primary" onClick={openFilePicker}>
            <Upload size={16} />
            <span>Import Users</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Users Table */}
      <div className="um-table-container">
        <table className="um-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Username</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="um-loading-cell">
                  <div className="um-loading-spinner"></div>
                  <span>Loading users...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="um-empty-cell">
                  <Users size={48} className="um-empty-icon" />
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.userId}>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-user-avatar">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="um-user-name">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="um-email-cell">{user.email}</td>
                  <td>
                    <span className={`um-role-badge um-role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="um-username-cell">{user.username}</td>
                  <td>
                    <span className={`um-status-badge ${user.isActive ? 'um-status-active' : 'um-status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="um-date-cell">{formatDateVN(user.createdAt)}</td>
                  <td>
                    <div className="um-action-buttons">
                      <button
                        className="um-action-btn um-action-edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                      >
                        <Pencil size={15} />
                      </button>
                      {user.role !== 'admin' && (
                        <>
                          <button
                            className={`um-action-btn ${user.isActive ? 'um-action-deactivate' : 'um-action-activate'}`}
                            onClick={() => handleToggleStatus(user)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            className="um-action-btn um-action-delete"
                            onClick={() => requestDeleteUser(user)}
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ImportPreviewModal
        showImportModal={showImportModal}
        importResult={importResult}
        selectedFileName={selectedFileName}
        onClose={() => { setShowImportModal(false); setImportResult(null); setSelectedFileName(''); }}
        onApplyImport={applyImport}
      />

      <EditUserModal
        editingUser={editingUser}
        editFormData={editFormData}
        onFormChange={handleEditFormChange}
        onSave={handleSaveEditUser}
        onCancel={handleCancelEdit}
      />

      <CreateFormModal
        showCreateForm={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />

      <DeleteConfirmationModal
        userToDelete={userToDelete}
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
      />

      <DeactivateConfirmationModal
        userToDeactivate={userToDeactivate}
        deactivationReason={deactivationReason}
        onReasonChange={setDeactivationReason}
        onConfirm={confirmDeactivateUser}
        onCancel={cancelDeactivateUser}
      />
    </AdminPageWrapper>
  );
};

export default UserManagement;
