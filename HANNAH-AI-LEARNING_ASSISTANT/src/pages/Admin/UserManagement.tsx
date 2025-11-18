import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createPortal } from 'react-dom';
// Replaced lucide-react icons with Unicode characters for simplicity
import AdminPageWrapper from './components/AdminPageWrapper';
import './UserManagement.css';
import { parseUsersFromFile, type ParsedResult } from '../../utils/userImport';
import userService, { type User } from '../../service/userService'; // Import user service and types

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]); // To store the full list
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // To store the displayed list
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(''); // Default to empty string for 'All'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    role: ''
  });
  const [importResult, setImportResult] = useState<ParsedResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State to hold the selected file

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

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Client-side filtering
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

    setSelectedFile(file); // Save the file to state
    setSelectedFileName(file.name);

    try {
      const result = await parseUsersFromFile(file);
      setImportResult(result);
      setShowImportModal(true);
    } catch (err) {
      alert('Cannot read the file. Please check the format (Excel/CSV) and try again.');
      console.error(err);
    } finally {
      // Reset input value so selecting the same file again still triggers change
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await userService.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_import_template.xlsx'; // Or get the name from headers if possible
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
    if (!selectedFile) { // Use the file from state
      addToast({ type: 'error', message: 'No file selected for import.' });
      return;
    }

    try {
      const result = await userService.importFaculty(selectedFile);
      addToast({ type: 'success', message: `${result.importedCount} users imported successfully!` });
      setShowImportModal(false);
      setSelectedFile(null); // Clear the file from state after import
      fetchUsers(); // Refresh the user list
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
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Failed to delete user:", error);
      addToast({ type: 'error', message: 'Failed to delete user.' });
    }
  };

  const cancelDeleteUser = () => setUserToDelete(null);

  const confirmDeactivateUser = async () => {
    if (deactivationReason.trim() === '') {
      addToast({ type: 'error', message: 'Vui lòng nhập lý do để vô hiệu hóa.' });
      return;
    }

    if (!userToDeactivate) return;
    try {
      await userService.deactivateUser(userToDeactivate.userId.toString(), deactivationReason);
      addToast({ type: 'success', message: `User ${userToDeactivate.fullName} has been deactivated.` });
      setUserToDeactivate(null);
      setDeactivationReason('');
      fetchUsers(); // Refresh the user list
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
      // If user is active, we want to deactivate them. Show the modal.
      setUserToDeactivate(user);
    } else {
      // If user is inactive, activate them directly.
      try {
        await userService.activateUser(user.userId.toString());
        addToast({ type: 'success', message: `User ${user.fullName} has been activated.` });
        fetchUsers(); // Refresh the user list
      } catch (error) {
        console.error('Failed to activate user:', error);
        addToast({ type: 'error', message: 'Failed to activate user.' });
      }
    }
  };

  // Handle opening edit modal
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  };

  // Handle edit form changes
  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle saving edited user
  const handleSaveEditUser = async () => {
    if (!editingUser) return;

    // Validation
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
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Failed to update user:', error);
      addToast({ type: 'error', message: 'Failed to update user.' });
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({ fullName: '', email: '', role: '' });
  };

  return (
    <AdminPageWrapper title="User Management">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-icon">
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div className="toast-message">{t.message}</div>
          </div>
        ))}
      </div>
      <div className="filters-section">
        <div className="search-box">
          <span className="char-icon" aria-hidden>🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, student code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <span className="char-icon" aria-hidden>⚙️</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button
          className="btn btn-secondary add-user-btn"
          onClick={handleDownloadTemplate}
          title="Download CSV template"
        >
          <span className="char-icon" aria-hidden>⬇️</span>
          Download CSV template
        </button>
        <button
          className="btn btn-secondary add-user-btn"
          onClick={openFilePicker}
          title="Import from Excel/CSV"
        >
          <span className="char-icon" aria-hidden>⬆️</span>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Username</th>
              <th>Status</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="loading-cell">Loading...</td>
              </tr>
            )}
            {!isLoading &&
              filteredUsers.map(user => (
                <tr key={user.userId}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.username}</td> {/* Displaying username instead of studentCode for now */}
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit"
                      >
                        <span className="char-icon" aria-hidden>✏️</span>
                      </button>

                      {/* Hide toggle and delete buttons for Admin role */}
                      {user.role !== 'admin' && (
                        <>
                          <button
                            className="btn-icon btn-toggle"
                            onClick={() => handleToggleStatus(user)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <span
                              className={`char-icon ${user.isActive ? 'icon-danger' : ''}`}
                              aria-hidden
                            >
                              {user.isActive ? 'X' : '✔️'}
                            </span>
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => requestDeleteUser(user)}
                            title="Delete"
                          >
                            <span className="char-icon" aria-hidden>🗑️</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredUsers.length === 0 && (
        <div className="no-data">
          <p>No users found matching your criteria.</p>
        </div>
      )}



      {/* Import Preview Modal */}
      {showImportModal && importResult && createPortal(
        (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Import users from Excel/CSV</h3>
              <div>
                <p><strong>File:</strong> {selectedFileName}</p>
                <p>
                  Valid: <strong>{importResult.valid.length}</strong> rows
                  {importResult.invalid.length > 0 && (
                    <>
                      {' '}| Errors: <strong style={{ color: '#d32f2f' }}>{importResult.invalid.length}</strong> rows
                    </>
                  )}
                </p>
                {importResult.invalid.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '8px 0' }}>Some example errors:</p>
                    <ul style={{ maxHeight: 160, overflowY: 'auto', paddingLeft: 18 }}>
                      {importResult.invalid.slice(0, 5).map((inv, i) => (
                        <li key={i}>
                          Row {inv.rowNumber}: {inv.errors.join('; ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowImportModal(false); setImportResult(null); setSelectedFileName(''); }}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  disabled={importResult.valid.length === 0}
                  onClick={applyImport}
                >
                  {`Add ${importResult.valid.length} users`}
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Edit User Modal */}
      {editingUser && createPortal(
        (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <div className="modal-title">Edit User</div>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                      Full Name <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.fullName}
                      onChange={(e) => handleEditFormChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                      Email <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={handleSaveEditUser}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Create Form Modal - Placeholder */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add new user</h3>
            <p>The form will be developed in the next version</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && createPortal(
        (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="danger-title">
                  <span className="char-icon" aria-hidden style={{fontSize: 20}}>⚠️</span>
                  <div>
                    <div className="modal-title">Delete user</div>
                    <div className="modal-subtext">This action cannot be undone.</div>
                  </div>

      {/* Deactivate Confirmation Modal */}
      {userToDeactivate && createPortal(
        (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="danger-title">
                  <span className="char-icon" aria-hidden style={{fontSize: 20}}>⚠️</span>
                  <div>
                    <div className="modal-title">Deactivate user</div>
                    <div className="modal-subtext">User will be temporarily suspended.</div>
                  </div>
                </div>
              </div>
              <div className="modal-body">
                <p>You are about to deactivate <strong>{userToDeactivate.fullName}</strong>. Please provide a reason (optional).</p>
                <textarea
                  className="reason-textarea"
                  placeholder="Enter reason for deactivation..."
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
                <button className="btn btn-secondary" onClick={cancelDeactivateUser}>Cancel</button>
                <button
                  className="btn btn-danger"
                  style={{justifyContent: 'center'}}
                  onClick={confirmDeactivateUser}
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

                </div>
              </div>
              <div className="modal-body">
                <div className="confirm-box">
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li><strong>Name:</strong> {userToDelete.fullName}</li>
                    <li><strong>Email:</strong> {userToDelete.email}</li>
                    <li><strong>Username:</strong> {userToDelete.username}</li>
                  </ul>
                </div>
              </div>
              <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
                <button className="btn btn-secondary" onClick={cancelDeleteUser}>Cancel</button>
                <button className="btn btn-danger" style={{justifyContent: 'center'}} onClick={confirmDeleteUser}>Delete</button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Deactivate Confirmation Modal */}
      {userToDeactivate && createPortal(
        (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="danger-title">
                  <span className="char-icon" aria-hidden style={{fontSize: 20}}>⚠️</span>
                  <div>
                    <div className="modal-title">Deactivate user</div>
                    <div className="modal-subtext">Please provide a reason for deactivation.</div>
                  </div>
                </div>
              </div>
              <div className="modal-body">
                <p>You are about to deactivate <strong>{userToDeactivate.fullName}</strong>.</p>
                <textarea
                  className="reason-textarea"
                  placeholder="Enter reason for deactivation (optional)"
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
                <button className="btn btn-secondary" onClick={cancelDeactivateUser}>Cancel</button>
                <button className="btn btn-danger" style={{justifyContent: 'center'}} onClick={confirmDeactivateUser}>Deactivate</button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </AdminPageWrapper>
  );
};

export default UserManagement;
