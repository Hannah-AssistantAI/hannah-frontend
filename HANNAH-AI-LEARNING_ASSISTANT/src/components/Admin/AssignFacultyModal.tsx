import React, { useState, useEffect } from 'react';
import { userService } from '../../service/userService';
import type { User } from '../../service/userService';
import { flaggingApiService } from '../../service/flaggingApi';
import type { AssignFacultyRequest } from '../../service/flaggingApi';

interface AssignFacultyModalProps {
    isOpen: boolean;
    flagId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const AssignFacultyModal: React.FC<AssignFacultyModalProps> = ({
    isOpen,
    flagId,
    onClose,
    onSuccess
}) => {
    const [facultyList, setFacultyList] = useState<User[]>([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load faculty list when modal opens
    useEffect(() => {
        if (isOpen) {
            loadFacultyList();
        }
    }, [isOpen]);

    const loadFacultyList = async () => {
        setIsLoadingFaculty(true);
        try {
            const users = await userService.getAllUsers();
            // Filter only faculty members
            const faculty = users.filter(user => user.role.toLowerCase() === 'faculty' && user.isActive);
            setFacultyList(faculty);
        } catch (err: any) {
            console.error('Error loading faculty list:', err);
            setError('Failed to load faculty list');
        } finally {
            setIsLoadingFaculty(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFacultyId) {
            setError('Please select a faculty member');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const request: AssignFacultyRequest = {
                facultyId: selectedFacultyId,
                note: note.trim() || undefined
            };

            await flaggingApiService.assignFacultyToFlag(flagId, request);

            // Success notification
            alert('Faculty assigned successfully!');

            // Reset form
            setSelectedFacultyId(null);
            setNote('');

            // Notify parent and close
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error assigning faculty:', err);
            setError(err.message || 'Failed to assign faculty');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setSelectedFacultyId(null);
            setNote('');
            setError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Assign Faculty</h3>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Faculty Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Faculty Member <span className="text-red-500">*</span>
                        </label>
                        {isLoadingFaculty ? (
                            <div className="text-sm text-gray-500">Loading faculty list...</div>
                        ) : (
                            <select
                                value={selectedFacultyId || ''}
                                onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">-- Select Faculty --</option>
                                {facultyList.map(faculty => (
                                    <option key={faculty.userId} value={faculty.userId}>
                                        {faculty.fullName} ({faculty.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Optional Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Note (Optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isLoading}
                            placeholder="Add any additional notes for the faculty member..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedFacultyId}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Assigning...' : 'Assign Faculty'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignFacultyModal;
