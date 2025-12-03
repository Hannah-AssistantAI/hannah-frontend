import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, ArrowLeft, User, Calendar, Flag, MessageSquare, UserCheck } from 'lucide-react';
import flaggingService, { type FlaggedItem, type MessageContext } from '../../../service/flaggingService';
import userService, { type User as UserType } from '../../../service/userService';
import ResolveModal from '../../Faculty/AssignedFlags/ResolveModal';
import './FlaggedMessageDetail.css';

const FlaggedMessageDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [item, setItem] = useState<FlaggedItem | null>(null);
    const [messageContext, setMessageContext] = useState<MessageContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Inline assignment states
    const [showAssignSection, setShowAssignSection] = useState(false);
    const [facultyList, setFacultyList] = useState<UserType[]>([]);
    const [facultySearch, setFacultySearch] = useState('');
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const isFacultyMode = window.location.pathname.includes('/faculty/');

    useEffect(() => {
        if (id) {
            loadFlaggedItem();
        }
    }, [id]);

    useEffect(() => {
        if (item?.type === 'message' && item.conversationId && item.messageId) {
            loadMessageContext();
        }
    }, [item]);

    const loadFlaggedItem = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to fetch the flag directly by ID first
            const foundItem = await flaggingService.getFlagById(Number(id));
            setItem(foundItem);
        } catch (err) {
            // If direct fetch fails, fall back to fetching from list 
            // (for backwards compatibility or if endpoint doesn't exist yet)
            try {
                const items = await flaggingService.getFlaggedItems();
                const foundItem = items.find(i => i.id === Number(id));

                if (!foundItem) {
                    setError('Flagged item not found');
                    return;
                }

                setItem(foundItem);
            } catch (fallbackErr) {
                setError(err instanceof Error ? err.message : 'Failed to load flagged item');
                console.error('Error loading flagged item:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMessageContext = async () => {
        if (!item?.conversationId || !item.messageId) return;

        try {
            const context = await flaggingService.getMessageContext(
                item.conversationId,
                String(item.messageId),
                5
            );
            setMessageContext(context);
        } catch (err) {
            console.error('Error loading message context:', err);
        }
    };

    const loadFacultyList = async () => {
        try {
            const faculty = await userService.getFacultyList();
            setFacultyList(faculty);
        } catch (err) {
            console.error('[ERROR] Failed to load faculty:', err);
            setAssignError(err instanceof Error ? err.message : 'Failed to load faculty');
        }
    };

    const handleAssignClick = () => {
        setShowAssignSection(true);
        setFacultySearch('');
        loadFacultyList();
    };

    const handleCancelAssign = () => {
        setShowAssignSection(false);
        setSelectedFacultyId(null);
        setFacultySearch('');
        setAssignError(null);
    };

    const handleConfirmAssign = async () => {
        if (!selectedFacultyId || !item) {
            setAssignError('Please select a faculty member');
            return;
        }

        try {
            setAssignLoading(true);
            setAssignError(null);

            await flaggingService.assignToFaculty(item.id, selectedFacultyId);

            // Reload the item to get updated data
            await loadFlaggedItem();
            setShowAssignSection(false);
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Assignment failed');
        } finally {
            setAssignLoading(false);
        }
    };

    // Filter faculty list by search term
    const filteredFacultyList = facultyList.filter(faculty =>
        faculty.fullName.toLowerCase().includes(facultySearch.toLowerCase()) ||
        faculty.email.toLowerCase().includes(facultySearch.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            message: 'Message',
            quiz: 'Quiz',
            flashcard: 'Flashcard',
            report: 'Report',
            mindmap: 'Mindmap'
        };
        return labels[type] || type;
    };

    const getStatusBadgeType = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' };
            case 'assigned':
                return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: '👤' };
            case 'resolved':
                return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: '✅' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: '' };
        }
    };

    const getPriorityBadgeType = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
            case 'medium':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
            case 'low':
                return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
        }
    };

    const getRoleLabel = (role: string, senderName?: string) => {
        if (role === 'user' || role === 'student') {
            return senderName || item?.flaggedByName || 'Student';
        }
        const labels: Record<string, string> = {
            assistant: 'AI Assistant',
            faculty: 'Faculty'
        };
        return labels[role] || role;
    };

    const handleBack = () => {
        const isFaculty = window.location.pathname.includes('/faculty/');
        navigate(isFaculty ? '/faculty/assigned-flags' : '/admin/flagged-messages');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-6 flex items-center justify-center">
                <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'Flagged item not found'}</p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const statusBadge = getStatusBadgeType(item.status);
    const priorityBadge = getPriorityBadgeType(item.priority);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
            {/* Sticky Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm sticky top-0 z-10">
                <div className="max-w-[1800px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all px-4 py-2.5 hover:bg-blue-50/80 rounded-xl group font-medium"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Flagged Messages</span>
                        </button>

                        {item.status?.toLowerCase() === 'pending' && !showAssignSection && !isFacultyMode && (
                            <button
                                onClick={handleAssignClick}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
                            >
                                <UserCheck size={18} />
                                Assign to Faculty
                            </button>
                        )}

                        {/* Faculty: Resolve button */}
                        {isFacultyMode && item.status?.toLowerCase() === 'assigned' && (
                            <button
                                onClick={() => setShowResolveModal(true)}
                                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
                            >
                                <Check size={18} />
                                Resolve
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Report Details - {getTypeLabel(item.type)}
                                </h1>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text} border-2 ${statusBadge.border} shadow-sm`}>
                                    {statusBadge.icon} {item.status}
                                </span>
                                {item.priority && (
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${priorityBadge.bg} ${priorityBadge.text} border-2 ${priorityBadge.border} shadow-sm`}>
                                        {item.priority}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mt-2 flex items-center gap-2 font-medium">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                Reported: {formatDate(item.flaggedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1800px] mx-auto p-6">
                <div className="flex gap-6">
                    {/* Main Content Area */}
                    <div className={`flex-1 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300`}>
                        <div className="p-8">
                            {/* Assignment Section (if active) */}
                            {showAssignSection && (
                                <div className="mb-8 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border-2 border-blue-300/60 rounded-2xl p-7 shadow-lg">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <UserCheck className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Assign to Faculty</h3>
                                    </div>

                                    {assignError && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2 text-red-700">
                                            <X className="w-5 h-5" />
                                            <span>{assignError}</span>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Faculty:</label>
                                            <input
                                                type="text"
                                                value={facultySearch}
                                                onChange={(e) => setFacultySearch(e.target.value)}
                                                placeholder="Enter name or email..."
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                                disabled={assignLoading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Faculty:</label>
                                            <select
                                                value={selectedFacultyId || ''}
                                                onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                                disabled={assignLoading}
                                                size={5}
                                            >
                                                <option value="">-- Select Faculty --</option>
                                                {filteredFacultyList.map((faculty) => (
                                                    <option key={faculty.userId} value={faculty.userId}>
                                                        {faculty.fullName} ({faculty.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {filteredFacultyList.length === 0 && facultySearch && (
                                                <small className="text-gray-500 mt-2 block">No faculty found</small>
                                            )}
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={handleConfirmAssign}
                                                disabled={assignLoading || !selectedFacultyId}
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Check size={18} />
                                                {assignLoading ? 'Assigning...' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={handleCancelAssign}
                                                disabled={assignLoading}
                                                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-xl transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <X size={18} />
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reason Section */}
                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 ring-4 ring-red-100">
                                            <Flag className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                                    </div>
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Report Reason
                                    </h3>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 via-rose-50/50 to-red-50 border-2 border-red-200/60 rounded-2xl p-7 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-red-300 backdrop-blur-sm">
                                    <p className="text-gray-800 leading-relaxed text-[15px] font-medium whitespace-pre-wrap">{item.reason}</p>
                                </div>
                            </div>

                            {/* Message Context Section */}
                            {item.type === 'message' && messageContext && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 ring-4 ring-purple-100">
                                                <MessageSquare className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                            Conversation Content
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        {messageContext.messages.map((msg, index) => {
                                            const isStudent = msg.role === 'user' || msg.role === 'student';
                                            const isFlagged = msg.messageId === messageContext.flaggedMessageId;

                                            return (
                                                <React.Fragment key={index}>
                                                    {/* Regular message */}
                                                    <div className="group">
                                                        <div className={`flex items-start gap-4 ${isStudent ? 'flex-row-reverse' : ''}`}>
                                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-4 group-hover:scale-110 transition-transform duration-300 ${isStudent
                                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 ring-blue-100'
                                                                : 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-500/20 ring-slate-100'
                                                                }`}>
                                                                <User className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className={`flex-1 ${isStudent ? 'text-right' : ''}`}>
                                                                <div className={`flex items-center gap-3 mb-2 ${isStudent ? 'justify-end' : ''}`}>
                                                                    <span className="font-bold text-sm text-gray-900">{getRoleLabel(msg.role, item.flaggedByName)}</span>
                                                                    <span className={`px-3 py-1 text-white text-xs font-bold rounded-full shadow-md ${isStudent ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-slate-500 to-slate-600'
                                                                        }`}>
                                                                        {isStudent ? 'Student' : 'AI'}
                                                                    </span>
                                                                </div>
                                                                <div className={`rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isFlagged
                                                                    ? 'bg-white border-2 border-red-400 ring-4 ring-red-100'
                                                                    : isStudent
                                                                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-2 border-blue-200/60'
                                                                        : 'bg-white border-2 border-gray-200'
                                                                    }`}>
                                                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">{msg.content}</p>
                                                                    {isFlagged && (
                                                                        <div className="mt-4 pt-4 border-t-2 border-red-200 flex items-center gap-2 text-red-700 font-bold">
                                                                            <Flag className="w-5 h-5" />
                                                                            Flagged message
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-2 font-medium">{formatDate(msg.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Resolution message */}
                                                    {isFlagged && item.status?.toLowerCase() === 'resolved' && (item.resolvedByName || item.resolutionNotes) && (
                                                        <div className="group">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100 group-hover:scale-110 transition-transform duration-300">
                                                                    <UserCheck className="w-6 h-6 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className="font-bold text-sm text-gray-900">{item.resolvedByName || 'Faculty'}</span>
                                                                        <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-md">
                                                                            Faculty
                                                                        </span>
                                                                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-md">
                                                                            RESOLVED
                                                                        </span>
                                                                    </div>
                                                                    <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-emerald-300/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-400 backdrop-blur-sm">
                                                                        {item.resolutionNotes && (
                                                                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px] font-medium">{item.resolutionNotes}</p>
                                                                        )}
                                                                    </div>
                                                                    {item.resolvedAt && (
                                                                        <p className="text-xs text-gray-500 mt-2 font-medium">{formatDate(item.resolvedAt)}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Non-message content info */}
                            {item.type !== 'message' && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <MessageSquare className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Content Information</h3>
                                    </div>
                                    <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-2xl p-6 border-2 border-gray-200 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-600">Content ID:</span>
                                            <span className="font-mono text-sm text-gray-900 bg-white px-3 py-1 rounded border">{item.contentId}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-600">Conversation ID:</span>
                                            <span className="font-mono text-sm text-gray-900 bg-white px-3 py-1 rounded border">{item.conversationId}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 transition-all duration-300 ${isSidebarCollapsed ? 'w-14' : 'w-96'
                        } flex-shrink-0 overflow-hidden`}>
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="w-full p-4 flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all border-b border-gray-200 group"
                        >
                            <svg
                                className={`w-5 h-5 text-blue-600 transition-transform duration-300 group-hover:scale-125 ${isSidebarCollapsed ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                            {!isSidebarCollapsed && <span className="ml-2 font-bold text-blue-900">Collapse</span>}
                        </button>

                        {!isSidebarCollapsed && (
                            <div className="p-6 overflow-y-auto max-h-[calc(100vh-100px)] space-y-6">
                                {/* Flagger Information */}
                                <div>
                                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-blue-200">
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        Reporter
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                                            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Name</p>
                                            <p className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors">{item.flaggedByName}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                                            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Time</p>
                                            <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{formatDate(item.flaggedAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment Info */}
                                {item.assignedToName && (
                                    <div>
                                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-purple-200">
                                            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                                <UserCheck className="w-5 h-5 text-white" />
                                            </div>
                                            Assigned To
                                        </h4>
                                        <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-xl p-4 border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg group">
                                            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Faculty</p>
                                            <p className="font-bold text-gray-900 text-base group-hover:text-purple-700 transition-colors">{item.assignedToName}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Resolution Info */}
                                {item.status?.toLowerCase() === 'resolved' && item.resolvedByName && (
                                    <div>
                                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-green-200">
                                            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                                <Check className="w-5 h-5 text-white" />
                                            </div>
                                            Resolved
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-xl p-4 border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg group">
                                                <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Resolved by</p>
                                                <p className="font-bold text-gray-900 text-base group-hover:text-green-700 transition-colors">{item.resolvedByName}</p>
                                            </div>
                                            {item.resolvedAt && (
                                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-xl p-4 border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg group">
                                                    <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Time</p>
                                                    <p className="font-semibold text-gray-900 text-sm group-hover:text-green-700 transition-colors">{formatDate(item.resolvedAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Resolve Modal for Faculty */}
            {showResolveModal && item && (
                <ResolveModal
                    flagId={item.id}
                    onClose={() => setShowResolveModal(false)}
                    onSuccess={() => {
                        setShowResolveModal(false);
                        loadFlaggedItem();
                    }}
                />
            )}
        </div>
    );
};

export default FlaggedMessageDetail;
