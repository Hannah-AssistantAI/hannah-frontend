import React from 'react';
import { createPortal } from 'react-dom';
import { type User } from '../../../../service/userService';

interface DeleteConfirmationModalProps {
    userToDelete: User | null;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    userToDelete,
    onConfirm,
    onCancel
}) => {
    if (!userToDelete) return null;

    return createPortal(
        (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="danger-title">
                            <span className="char-icon" aria-hidden style={{ fontSize: 20 }}>⚠️</span>
                            <div>
                                <div className="modal-title">Delete user</div>
                                <div className="modal-subtext">This action cannot be undone.</div>
                            </div>
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
                        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                        <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={onConfirm}>Delete</button>
                    </div>
                </div>
            </div>
        ),
        document.body
    );
};

export default DeleteConfirmationModal;
