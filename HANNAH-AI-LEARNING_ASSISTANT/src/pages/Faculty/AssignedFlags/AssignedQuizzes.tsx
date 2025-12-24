import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertCircle, User, Calendar, Wifi, WifiOff } from 'lucide-react';
import type { FlaggedItem } from '../../../service/flaggingService';
import flaggingService from '../../../service/flaggingService';
import { getStatusDisplay, getStatusClass, isResolved } from '../../../utils/statusHelpers';
import { useRealtimeEvent } from '../../../hooks/useRealtime';
import type { FlagResolvedData, FlagAssignedData, QuizFlaggedData } from '../../../hooks/useRealtime';
import { useRealtimeContext } from '../../../contexts/RealtimeContext';
import { toast } from 'react-hot-toast';
import { formatDateTimeVN } from '../../../utils/dateUtils';

type FilterStatus = 'processing' | 'resolved';

const AssignedQuizzes: React.FC = () => {
    const navigate = useNavigate();
    const { isConnected } = useRealtimeContext();
    const [assignedFlags, setAssignedFlags] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('processing');

    // 🔔 Real-time: Handle quiz flagged
    const handleQuizFlagged = useCallback((data: QuizFlaggedData) => {
        console.log('[AssignedQuizzes] Quiz flagged:', data);
        loadAssignedFlags();
        toast.success(`New quiz flagged!`);
    }, []);

    // 🔔 Real-time: Handle flag assigned
    const handleFlagAssigned = useCallback((data: FlagAssignedData) => {
        console.log('[AssignedQuizzes] Flag assigned:', data);
        loadAssignedFlags();
        toast.success(`New flag assigned to you!`);
    }, []);

    // 🔔 Real-time: Handle flag resolved
    const handleFlagResolved = useCallback((data: FlagResolvedData) => {
        console.log('[AssignedQuizzes] Flag resolved:', data);
        setAssignedFlags(prev => prev.map(item =>
            item.id === data.flagId
                ? { ...item, status: 'Resolved' }
                : item
        ));
    }, []);

    // Subscribe to real-time events
    useRealtimeEvent('QuizFlagged', handleQuizFlagged);
    useRealtimeEvent('FlagAssigned', handleFlagAssigned);
    useRealtimeEvent('FlagResolved', handleFlagResolved);

    useEffect(() => {
        loadAssignedFlags();
    }, []);

    const loadAssignedFlags = async () => {
        try {
            setLoading(true);
            setError(null);
            const flags = await flaggingService.getAssignedFlags();
            // Filter only quiz flags
            const quizFlags = flags.filter(f => f.type === 'quiz');
            setAssignedFlags(quizFlags);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load quiz list');
            console.error('Error loading assigned quiz flags:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadgeClass = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        return formatDateTimeVN(dateString);
    };

    const filteredFlags = assignedFlags.filter(flag => {
        if (filterStatus === 'resolved') return isResolved(flag.status);
        if (filterStatus === 'processing') return !isResolved(flag.status);
        return true;
    });

    const getStatusCount = (status: FilterStatus): number => {
        if (status === 'resolved') return assignedFlags.filter(f => isResolved(f.status)).length;
        if (status === 'processing') return assignedFlags.filter(f => !isResolved(f.status)).length;
        return 0;
    };

    const stats = {
        total: assignedFlags.length,
        processing: getStatusCount('processing'),
        resolved: getStatusCount('resolved')
    };

    if (loading && assignedFlags.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30">
            <div className="max-w-[1800px] mx-auto p-6">
                {/* Page Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-indigo-700 bg-clip-text text-transparent mb-2">
                            📝 Assigned Quizzes
                        </h1>
                        <p className="text-gray-600 text-base font-medium">
                            Manage and process flagged quizzes assigned to you
                        </p>
                    </div>
                    {/* Real-time connection indicator */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isConnected
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                        {isConnected ? (
                            <>
                                <Wifi className="w-3.5 h-3.5" />
                                <span>Live</span>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-3.5 h-3.5" />
                                <span>Offline</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700 font-semibold text-sm">{error}</span>
                        </div>
                        <button
                            onClick={loadAssignedFlags}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Total Quizzes</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs font-semibold text-blue-700 mb-1">Processing</div>
                            <div className="text-2xl font-bold text-blue-800">{stats.processing}</div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-green-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs font-semibold text-green-700 mb-1">Resolved</div>
                            <div className="text-2xl font-bold text-green-800">{stats.resolved}</div>
                        </div>
                    </div>
                </div>

                {/* Status Filter */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-gray-100 mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">Status:</span>
                        <div className="flex gap-2">
                            {(['processing', 'resolved'] as FilterStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 text-sm ${filterStatus === status
                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                                        }`}
                                >
                                    <span>{status === 'processing' ? 'Processing' : 'Resolved'}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${filterStatus === status
                                        ? 'bg-white/30 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {getStatusCount(status)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    {filteredFlags.length === 0 ? (
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-md border border-gray-100 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No quizzes found</h3>
                            <p className="text-gray-600 text-sm">
                                {filterStatus === 'processing'
                                    ? 'No quizzes being processed'
                                    : 'No resolved quizzes'}
                            </p>
                        </div>
                    ) : (
                        filteredFlags.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20">
                                            <AlertCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-base font-bold text-gray-900">Quiz</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusClass(item.status) === 'resolved'
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                                    }`}>
                                                    {getStatusDisplay(item.status)}
                                                </span>
                                                {item.priority && (
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span className="font-medium">Reported by: {item.flaggedByName}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{formatDate(item.flaggedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="mb-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Report reason:</label>
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-3 border border-gray-200">
                                        <p className="text-gray-800 leading-relaxed text-sm">
                                            {item.reason.length > 200 ? `${item.reason.substring(0, 200)}...` : item.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/faculty/assigned-flags/quizzes/${item.id}`);
                                        }}
                                        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignedQuizzes;
