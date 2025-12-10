import React from 'react';
import { createPortal } from 'react-dom';
import { type User } from '../../../../service/userService';

interface EditUserModalProps {
    editingUser: User | null;
    editFormData: {
        fullName: string;
        email: string;
        role: string;
    };
    onFormChange: (field: string, value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
    editingUser,
    editFormData,
    onFormChange,
    onSave,
    onCancel
}) => {
    if (!editingUser) return null;

    return createPortal(
        (
            <div className="modal-overlay">
                <div className="modal">
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
                                    onChange={(e) => onFormChange('fullName', e.target.value)}
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
                                    onChange={(e) => onFormChange('email', e.target.value)}
                                    placeholder="Enter email"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
                        <button className="btn btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ justifyContent: 'center' }}
                            onClick={onSave}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        ),
        document.body
    );
};

export default EditUserModal;
