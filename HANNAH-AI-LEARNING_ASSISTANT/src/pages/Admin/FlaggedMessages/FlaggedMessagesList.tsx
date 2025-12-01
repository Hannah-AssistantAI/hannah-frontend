import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, Flag, MessageSquare, AlertCircle, CheckCircle, Clock, User, Calendar } from 'lucide-react';
import flaggingService, { type FlaggedItem } from '../../../service/flaggingService';
import { isPending, isProcessing, isResolved } from '../../../utils/statusHelpers';
import './FlaggedMessagesList.css';

type FilterStatus = 'Pending' | 'Assigned' | 'Resolved';

const FlaggedMessagesList: React.FC = () => {
    const navigate = useNavigate();
    const [allItems, setAllItems] = useState<FlaggedItem[]>([]);
    const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('Pending');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFlaggedItems();
    }, [filterStatus]);

    const loadFlaggedItems = async () => {
        try {
            setLoading(true);
            setError(null);

            const allItemsData = await flaggingService.getFlaggedItems();
            setAllItems(allItemsData);

            const items = await flaggingService.getFlaggedItems(filterStatus);
            setFlaggedItems(items);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load flagged items');
            console.error('Error loading flagged items:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusCount = (status: FilterStatus): number => {
        if (status === 'Pending') {
            return allItems.filter(item => isPending(item.status || '')).length;
        } else if (status === 'Assigned') {
            return allItems.filter(item => isProcessing(item.status || '')).length;
        } else if (status === 'Resolved') {
            return allItems.filter(item => isResolved(item.status || '')).length;
        }
        return 0;
    };

    const filteredItems = flaggedItems.filter(item =>
        item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.flaggedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'message':
                return <MessageSquare className="w-5 h-5" />;
            case 'quiz':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <Flag className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            message: 'Tin nhắn',
            quiz: 'Quiz',
            flashcard: 'Flashcard',
            report: 'Báo cáo',
            mindmap: 'Sơ đồ tư duy'
        };
        return labels[type] || type;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'assigned':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'resolved':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
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

    const stats = {
        total: allItems.length,
        pending: getStatusCount('Pending'),
        assigned: getStatusCount('Assigned'),
        resolved: getStatusCount('Resolved')
    };

    if (loading && flaggedItems.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
            <div className="max-w-[1800px] mx-auto p-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                        Quản Lý Nội Dung Được Báo Cáo
                    </h1>
                    <p className="text-gray-600 text-base font-medium">
                        Xem và quản lý các tin nhắn, quiz, flashcard và nội dung khác được báo cáo bởi học sinh
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700 font-semibold text-sm">{error}</span>
                        </div>
                        <button
                            onClick={loadFlaggedItems}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Flag className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Tổng Báo Cáo</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-yellow-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-yellow-500/20 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs font-semibold text-yellow-700 mb-1">Chờ Xử Lý</div>
                            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs font-semibold text-blue-700 mb-1">Đã Giao</div>
                            <div className="text-2xl font-bold text-blue-800">{stats.assigned}</div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-green-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs font-semibold text-green-700 mb-1">Đã Giải Quyết</div>
                            <div className="text-2xl font-bold text-green-800">{stats.resolved}</div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo lý do, người báo cáo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-400 text-sm"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            {(['Pending', 'Assigned', 'Resolved'] as FilterStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 text-sm ${filterStatus === status
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                                        }`}
                                >
                                    <span>{status}</span>
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
                    {filteredItems.length === 0 ? (
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-md border border-gray-100 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Flag className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Không có báo cáo nào</h3>
                            <p className="text-gray-600 text-sm">Không có báo cáo nào ở trạng thái "{filterStatus}"</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer"
                                onClick={() => navigate(`/admin/flagged-messages/${item.id}`)}
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 ${item.type === 'message'
                                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/20'
                                            : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                                            }`}>
                                            {getTypeIcon(item.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-base font-bold text-gray-900">{getTypeLabel(item.type)}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
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
                                                    <span className="font-medium">Báo cáo bởi: {item.flaggedByName}</span>
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
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Lý do báo cáo:</label>
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-3 border border-gray-200">
                                        <p className="text-gray-800 leading-relaxed text-sm">
                                            {item.reason.length > 200 ? `${item.reason.substring(0, 200)}...` : item.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Assignment Info */}
                                {item.assignedToName && (
                                    <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-xs font-semibold text-blue-900">
                                            Được giao cho: {item.assignedToName}
                                        </span>
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/admin/flagged-messages/${item.id}`);
                                        }}
                                        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Xem Chi Tiết
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

export default FlaggedMessagesList;
