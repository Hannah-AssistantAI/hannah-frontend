import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../../config/apiConfig';
import './AssignFacultyModal.css';

interface User {
    userId: number;
    fullName: string;
    email: string;
    role: string;
}

interface AssignFacultyModalProps {
    flagId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const AssignFacultyModal: React.FC<AssignFacultyModalProps> = ({ flagId, onClose, onSuccess }) => {
    const [facultyList, setFacultyList] = useState<User[]>([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFacultyList();
    }, []);

    const loadFacultyList = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/Users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}`
                }
            });

            if (!response.ok) throw new Error('Failed to load faculty list');

            const apiResponse = await response.json();

            // Extract users array from items property (API returns { items: [...] })
            const users: User[] = apiResponse.items || [];

            console.log('[DEBUG] Total users:', users.length);

            // Filter only faculty members by role
            const faculty = users.filter(u => u.role === 'faculty');

            console.log('[DEBUG] Faculty count:', faculty.length);
            console.log('[DEBUG] Faculty list:', faculty);

            setFacultyList(faculty);
        } catch (err) {
            console.error('[ERROR] Failed to load faculty:', err);
            setError(err instanceof Error ? err.message : 'Failed to load faculty');
        }
    };

    const handleAssign = async () => {
        if (!selectedFacultyId) {
            alert('Vui lòng chọn giảng viên');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `http://localhost:5001/api/Conversations/flagged/${flagId}/assign`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}`
                    },
                    body: JSON.stringify({ facultyId: selectedFacultyId })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to assign faculty');
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Assignment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="assign-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Giao Cho Giảng Viên</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Chọn giảng viên:</label>
                        <select
                            value={selectedFacultyId || ''}
                            onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                            className="faculty-select"
                            disabled={loading}
                        >
                            <option value="">-- Chọn giảng viên --</option>
                            {facultyList.map((faculty) => (
                                <option key={faculty.userId} value={faculty.userId}>
                                    {faculty.fullName} ({faculty.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {facultyList.length === 0 && !error && (
                        <p className="no-faculty-message">Đang tải danh sách giảng viên...</p>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-assign"
                        onClick={handleAssign}
                        disabled={loading || !selectedFacultyId}
                    >
                        {loading ? 'Đang giao...' : 'Giao'}
                    </button>
                    <button className="btn-cancel" onClick={onClose} disabled={loading}>
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignFacultyModal;
