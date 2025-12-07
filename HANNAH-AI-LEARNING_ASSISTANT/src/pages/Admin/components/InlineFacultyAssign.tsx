import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Loader2, UserCheck } from 'lucide-react';
import flaggingService from '../../../service/flaggingService';
import { API_BASE_URL, STORAGE_KEYS } from '../../../config/apiConfig';

interface InlineFacultyAssignProps {
    flagId: number;
    currentAssignee?: string;
    onSuccess: () => void;
}

interface Faculty {
    userId: number;
    fullName: string;
    email: string;
}

export function InlineFacultyAssign({ flagId, currentAssignee, onSuccess }: InlineFacultyAssignProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setError('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load faculty list when dropdown opens
    useEffect(() => {
        if (isOpen && facultyList.length === 0) {
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
            setError('Failed to load faculty');
            console.error('[InlineFacultyAssign] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (facultyId: number) => {
        setSubmitting(true);
        setError('');

        try {
            await flaggingService.assignFlagToFaculty(flagId, facultyId);
            setIsOpen(false);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to assign');
            console.error('Error assigning flag:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-70"
            >
                {submitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Assigning...
                    </>
                ) : (
                    <>
                        <UserCheck className="w-4 h-4" />
                        {currentAssignee ? 'Re-assign' : 'Assign Faculty'}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        animation: 'dropdownSlide 0.2s ease-out',
                        maxHeight: '320px'
                    }}
                >
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                        <p className="text-sm font-semibold text-purple-800">Select Faculty Member</p>
                        {currentAssignee && (
                            <p className="text-xs text-purple-600 mt-1">
                                Currently: <span className="font-medium">{currentAssignee}</span>
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-[200px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : facultyList.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No faculty available</p>
                            </div>
                        ) : (
                            <div className="py-1">
                                {facultyList.map((faculty) => (
                                    <button
                                        key={faculty.userId}
                                        onClick={() => handleAssign(faculty.userId)}
                                        disabled={submitting}
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left group disabled:opacity-50"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                                            {faculty.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate group-hover:text-purple-700 transition-colors">
                                                {faculty.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {faculty.email}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-purple-600" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* CSS for animation */}
            <style>{`
                @keyframes dropdownSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
