import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/Admin/Button';
import './ApprovalModal.css';

interface ApprovalModalProps {
  isOpen: boolean;
  action: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, action, onClose, onConfirm }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    onConfirm(action === 'reject' ? rejectionReason : undefined);
    setRejectionReason('');
    setError('');
  };

  const handleClose = () => {
    setRejectionReason('');
    setError('');
    onClose();
  };

  return (
    <div className="approval-modal-overlay" onClick={handleClose}>
      <div className="approval-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          {action === 'approve' ? (
            <>
              <CheckCircle size={48} className="icon-success" />
              <h2>Approve Custom Message</h2>
            </>
          ) : (
            <>
              <AlertCircle size={48} className="icon-danger" />
              <h2>Reject Custom Message</h2>
            </>
          )}
        </div>

        <div className="modal-body">
          {action === 'approve' ? (
            <p>
              Are you sure you want to approve this customized message? Once approved, this
              customized response will be used in future conversations.
            </p>
          ) : (
            <>
              <p>
                Please provide a detailed reason for rejecting this customized message. The
                faculty member will receive this feedback.
              </p>
              <div className="form-group">
                <label htmlFor="rejection-reason">
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter the reason for rejection..."
                  rows={5}
                  className={error ? 'error' : ''}
                />
                {error && <span className="error-message">{error}</span>}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant={action === 'approve' ? 'success' : 'danger'}
            onClick={handleConfirm}
          >
            {action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
