import React from 'react';

interface CreateFormModalProps {
    showCreateForm: boolean;
    onClose: () => void;
}

const CreateFormModal: React.FC<CreateFormModalProps> = ({
    showCreateForm,
    onClose
}) => {
    if (!showCreateForm) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Add new user</h3>
                <p>The form will be developed in the next version</p>
                <div className="modal-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateFormModal;
