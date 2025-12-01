import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import flaggingService from '../../../service/flaggingService';
import { API_BASE_URL, STORAGE_KEYS } from '../../../config/apiConfig';

interface AssignFacultyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    flagId: number;
    currentAssignee?: string;
}

interface Faculty {
    userId: number;
    fullName: string;
    email: string;
}

export function AssignFacultyModal({ isOpen, onClose, onSuccess, flagId, currentAssignee }: AssignFacultyModalProps) {
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadFacultyList();
        }
    }, [isOpen]);

    const loadFacultyList = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            const response = await fetch(`${API_BASE_URL}/api/Users?role=faculty`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch faculty list (${response.status})`);
            }

            const data = await response.json();
            const facultyArray = data.items || data.data || (Array.isArray(data) ? data : []);
            setFacultyList(facultyArray);
        } catch (err) {
            setError('Failed to load faculty list. Please try again.');
            console.error('[AssignFacultyModal] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedFacultyId) {
            setError('Please select a faculty member');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await flaggingService.assignFlagToFaculty(flagId, selectedFacultyId);
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to assign flag');
            console.error('Error assigning flag:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setSelectedFacultyId(null);
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <UserCheck className="text-purple-600" size={24} />
                        <h2 className="text-lg font-semibold text-slate-800">Assign to Faculty</h2>
                    </div>
                    <button onClick={handleClose} disabled={submitting} className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50">
                        <X size={24} />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {currentAssignee && (
                        <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
                            Currently assigned to: <strong>{currentAssignee}</strong>
                        </p>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Faculty Member</label>

                        {loading ? (
                            <div className="text-sm text-slate-500 py-4 text-center">Loading faculty list...</div>
                        ) : facultyList.length === 0 ? (
                            <div className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-md">No faculty members available</div>
                        ) : (
                            <select
                                value={selectedFacultyId || ''}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : null;
                                    setSelectedFacultyId(value);
                                }}
                                disabled={submitting}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Select a faculty member...</option>
                                {facultyList.map((faculty) => (
                                    <option key={faculty.userId} value={faculty.userId}>
                                        {faculty.fullName} ({faculty.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>
                    )}
                </div>

                <div className="flex gap-3 px-6 py-4 border-t bg-slate-50">
                    <button onClick={handleClose} disabled={submitting} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                        Cancel
                    </button>
                    <button onClick={handleAssign} disabled={submitting || !selectedFacultyId || loading} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                        {submitting ? 'Assigning...' : 'Assign'}
                    </button>
                </div>
            </div>
        </div>
    );
}
