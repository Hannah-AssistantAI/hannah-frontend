import React from 'react';
import { createPortal } from 'react-dom';
import { type User } from '../../../../service/userService';

interface DeactivateConfirmationModalProps {
    userToDeactivate: User | null;
    deactivationReason: string;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeactivateConfirmationModal: React.FC<DeactivateConfirmationModalProps> = ({
    userToDeactivate,
    deactivationReason,
    onReasonChange,
    onConfirm,
    onCancel
}) => {
    if (!userToDeactivate) return null;

    return createPortal(
        (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="danger-title">
                            <span className="char-icon" aria-hidden style={{ fontSize: 20 }}>⚠️</span>
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
                            onChange={(e) => onReasonChange(e.target.value)}
                        />
                    </div>
                    <div className="modal-actions" style={{ padding: '0 20px 20px' }}>
                        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                        <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={onConfirm}>Deactivate</button>
                    </div>
                </div>
            </div>
        ),
        document.body
    );
};

export default DeactivateConfirmationModal;
