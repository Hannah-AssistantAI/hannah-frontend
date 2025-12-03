import { useEffect, useMemo, useState } from 'react';
import { flaggingApiService } from '../../service/flaggingApi';
import type { FlaggedItem } from '../../service/flaggingApi';
import FlagDetailModal from '../../components/Flagging/FlagDetailModal';

export default function MyAssignments() {
    const [items, setItems] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedItem, setSelectedItem] = useState<FlaggedItem | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const loadAssignedFlags = async () => {
        setLoading(true);
        try {
            const data = await flaggingApiService.getMyAssignedFlags();
            setItems(data);
        } catch (error) {
            console.error('Error loading assigned flags:', error);
            alert('Failed to load assigned flags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssignedFlags();
    }, []);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return items.filter(item => {
            const matchesSearch = !term || [
                item.reason,
                item.flaggedByName,
                item.type,
                item.id.toString()
            ].some(v => (v || '').toLowerCase().includes(term));

            const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

            return matchesSearch && matchesPriority;
        });
    }, [items, search, priorityFilter]);

    const stats = useMemo(() => {
        const high = items.filter(i => i.priority === 'High').length;
        const medium = items.filter(i => i.priority === 'Medium').length;
        const low = items.filter(i => i.priority === 'Low').length;
        return { total: items.length, high, medium, low };
    }, [items]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'quiz': return '📝';
            case 'flashcard': return '🗂️';
            case 'report': return '📊';
            case 'mindmap': return '🧠';
            case 'message': return '💬';
            default: return '🚩';
        }
    };

    const getPriorityBadge = (priority: string) => {
        const priorityLower = priority.toLowerCase();
        if (priorityLower === 'high') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                    High
                </span>
            );
        } else if (priorityLower === 'medium') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                    Medium
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-500"></span>
                    Low
                </span>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
                            <p className="text-sm text-gray-500 mt-1">Các nội dung bị gắn cờ được phân công cho bạn</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={loadAssignedFlags}
                                className="px-4 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 shadow-sm transition-colors"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={() => { setSearch(''); setPriorityFilter('all'); }}
                                className="px-4 py-2 text-sm rounded-md bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Assigned</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-red-600 uppercase tracking-wide">High Priority</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">{stats.high}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🔴</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Medium Priority</p>
                                <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.medium}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🟡</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Low Priority</p>
                                <p className="text-2xl font-bold text-gray-700 mt-1">{stats.low}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">⚪</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-600 mb-1">Tìm kiếm</label>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Reason, Flagged By, Type, ID..."
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">Priority</label>
                            <select
                                value={priorityFilter}
                                onChange={e => setPriorityFilter(e.target.value)}
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        {loading && <div className="text-sm text-gray-500">Loading...</div>}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Reason</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Flagged By</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Flagged At</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.id}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                {getTypeIcon(item.type)}
                                                <span className="capitalize">{item.type}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <div className="truncate text-gray-700" title={item.reason}>
                                                {item.reason || '(no reason)'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{getPriorityBadge(item.priority)}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.flaggedByName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                            {new Date(item.flaggedAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsDetailModalOpen(true);
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="text-3xl">📭</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">No assignments found</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {search || priorityFilter !== 'all'
                                                            ? 'Try adjusting your filters'
                                                            : 'You have no flagged items assigned to you'}
                                                    </p>
                                                </div>
                                                {(search || priorityFilter !== 'all') && (
                                                    <button
                                                        onClick={() => { setSearch(''); setPriorityFilter('all'); }}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <FlagDetailModal
                    isOpen={isDetailModalOpen}
                    item={selectedItem}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedItem(null);
                    }}
                    onSuccess={() => {
                        loadAssignedFlags(); // Reload list after resolution
                    }}
                />
            )}
        </div>
    );
}
