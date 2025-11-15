import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
// Replaced lucide-react icons with Unicode characters for simplicity
import AdminPageWrapper from './components/AdminPageWrapper';
import './UserManagement.css';
import { parseUsersFromFile, type ParsedResult, generateUserTemplateCSV, downloadCSV } from '../../utils/userImport';

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
  const [importResult, setImportResult] = useState<ParsedResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
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

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    try {
      const result = await parseUsersFromFile(file);
      setImportResult(result);
      setShowImportModal(true);
    } catch (err) {
      alert('Cannot read the file. Please check the format (Excel/CSV) and try again.');
      console.error(err);
    } finally {
      // reset input value so selecting the same file again still triggers change
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyImport = async () => {
    if (!importResult) return;
    setImporting(true);
    try {
      const now = Date.now();
      const newUsers: User[] = importResult.valid.map((row, idx) => ({
        id: String(now + idx),
        name: row.name,
        email: row.email,
        role: row.role,
        studentCode: row.studentCode,
        status: row.status ?? 'Active',
        createdAt: row.createdAt ?? new Date().toISOString(),
      }));
      setUsers(prev => [...newUsers, ...prev]);
      setShowImportModal(false);
      setImportResult(null);
      setSelectedFileName('');
      addToast({ type: 'success', message: `Added ${newUsers.length} users` });
    } finally {
      setImporting(false);
    }
  };

  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const requestDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
    setUserToDelete(null);
    addToast({ type: 'success', message: 'User deleted' });
  };

  const cancelDeleteUser = () => setUserToDelete(null);

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
        : user
    ));
    const u = users.find(u => u.id === userId);
    if (u) {
      const next = u.status === 'Active' ? 'Inactive' : 'Active';
      addToast({ type: 'info', message: `Changed status of ${u.name} to ${next}` });
    }
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
            <option value="All">All roles</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button
          className="btn btn-secondary add-user-btn"
          onClick={() => downloadCSV(generateUserTemplateCSV())}
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
        <button
          className="btn btn-primary add-user-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="char-icon" aria-hidden>➕</span>
          Add user
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
              <th>Student Code</th>
              <th>Status</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role === 'Student' ? 'Student' :
                     user.role === 'Faculty' ? 'Faculty' : 'Admin'}
                  </span>
                </td>
                <td>{user.studentCode || '-'}</td>
                <td>
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status === 'Active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('en-US')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => setEditingUser(user)}
                      title="Edit"
                    >
                      <span className="char-icon" aria-hidden>✏️</span>
                    </button>
                    <button
                      className="btn-icon btn-toggle"
                      onClick={() => handleToggleStatus(user.id)}
                      title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                      <span
                        className={`char-icon ${user.status === 'Active' ? 'icon-danger' : ''}`}
                        aria-hidden
                      >
                        {user.status === 'Active' ? 'X' : '✔️'}
                      </span>
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => requestDeleteUser(user)}
                      title="Delete"
                    >
                      <span className="char-icon" aria-hidden>🗑️</span>
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
          <p>No users found</p>
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
                  disabled={importing || importResult.valid.length === 0}
                  onClick={applyImport}
                >
                  {importing ? 'Importing...' : `Add ${importResult.valid.length} users`}
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Create/Edit Form Modal - Placeholder */}
      {(showCreateForm || editingUser) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingUser ? 'Edit user' : 'Add new user'}</h3>
            <p>The form will be developed in the next version</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                }}
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
                </div>
              </div>
              <div className="modal-body">
                <div className="confirm-box">
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li><strong>Name:</strong> {userToDelete.name}</li>
                    <li><strong>Email:</strong> {userToDelete.email}</li>
                    {userToDelete.studentCode && (
                      <li><strong>Student Code:</strong> {userToDelete.studentCode}</li>
                    )}
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
    </AdminPageWrapper>
  );
};

export default UserManagement;
