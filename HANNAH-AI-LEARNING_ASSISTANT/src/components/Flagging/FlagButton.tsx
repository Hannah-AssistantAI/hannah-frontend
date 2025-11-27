import React, { useState } from 'react';
import axios from 'axios';
import './FlagButton.css';

interface FlagButtonProps {
    contentType: 'quiz' | 'flashcard' | 'report' | 'mindmap';
    contentId: number;
    size?: 'small' | 'medium' | 'large';
    onFlagSuccess?: () => void;
}

const FlagButton: React.FC<FlagButtonProps> = ({
    contentType,
    contentId,
    size = 'medium',
    onFlagSuccess
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFlag = async () => {
        if (!reason.trim()) {
            alert('Please provide a reason for flagging');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/flagging/content/flag',
                {
                    flagType: contentType,
                    contentId: contentId,
                    reason: reason,
                    priority: priority
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            alert(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} flagged successfully!`);
            setIsOpen(false);
            setReason('');
            setPriority('Medium');

            if (onFlagSuccess) {
                onFlagSuccess();
            }
        } catch (error: any) {
            console.error('Error flagging content:', error);
            alert(error.response?.data?.message || 'Failed to flag content');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = () => {
        switch (contentType) {
            case 'quiz': return '📝';
            case 'flashcard': return '🗂️';
            case 'report': return '📊';
            case 'mindmap': return '🧠';
            default: return '🚩';
        }
    };

    return (
        <>
            <button
                className={`flag-button flag-button-${size}`}
                onClick={() => setIsOpen(true)}
                title={`Flag this ${contentType}`}
            >
                🚩 Flag
            </button>

            {isOpen && (
                <div className="flag-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="flag-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="flag-modal-header">
                            <h3>{getIcon()} Flag this {contentType}</h3>
                            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <div className="flag-modal-body">
                            <div className="form-group">
                                <label>Reason for flagging:</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Please describe the issue..."
                                    rows={4}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label>Priority:</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                                    disabled={isSubmitting}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="flag-modal-footer">
                            <button
                                className="cancel-button"
                                onClick={() => setIsOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="submit-button"
                                onClick={handleFlag}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Flag'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FlagButton;
