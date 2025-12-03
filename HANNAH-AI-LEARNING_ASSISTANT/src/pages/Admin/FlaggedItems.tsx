import { useEffect, useMemo, useState } from 'react';
import { flaggingApiService } from '../../service/flaggingApi';
import type { FlaggedItem } from '../../service/flaggingApi';
import AdminPageWrapper from './components/AdminPageWrapper';
import AssignFacultyModal from '../../components/Admin/AssignFacultyModal';

export default function FlaggedItems() {
    const [items, setItems] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFlagId, setSelectedFlagId] = useState<number | null>(null);

    const loadFlaggedItems = async () => {
        setLoading(true);
        try {
            const status = statusFilter === 'all' ? undefined : statusFilter;
            const data = await flaggingApiService.getFlaggedItems(status);
            setItems(data);
        } catch (error) {
            console.error('Error loading flagged items:', error);
            alert('Failed to load flagged items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFlaggedItems();
    }, [statusFilter]);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return items.filter(item => {
            const matchesSearch = !term || [
                item.reason,
                item.flaggedByName,
                item.assignedToName,
                item.type,
                item.id.toString()
            ].some(v => (v || '').toLowerCase().includes(term));

            const matchesType = typeFilter === 'all' || item.type === typeFilter;

            return matchesSearch && matchesType;
        });
    }, [items, search, typeFilter]);

    const stats = useMemo(() => {
        const pending = items.filter(i => i.status === 'Pending').length;
        const assigned = items.filter(i => i.status === 'Assigned').length;
        const resolved = items.filter(i => i.status === 'Resolved').length;
        return { total: items.length, pending, assigned, resolved };
    }, [items]);

    const handleAssignClick = (flagId: number) => {
        setSelectedFlagId(flagId);
        setIsModalOpen(true);
    };

    const handleAssignSuccess = () => {
        loadFlaggedItems(); // Reload data after successful assignment
    };

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

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                    Pending
                </span>
            );
        } else if (statusLower === 'assigned') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    Assigned
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    Resolved
                </span>
            );
        }
    };

    const getPriorityBadge = (priority: string) => {
        const priorityLower = priority.toLowerCase();
        if (priorityLower === 'high') {
            return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">High</span>;
        } else if (priorityLower === 'medium') {
            return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Medium</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">Low</span>;
        }
    };

    return (
        <AdminPageWrapper title="Flagged Items">
            <div className="p-4 space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">Flagged Content Management</h2>
                            <p className="text-sm text-slate-500">Quản lý tất cả nội dung bị gắn cờ từ sinh viên</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={loadFlaggedItems}
                                className="px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 shadow-sm"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
                                className="px-3 py-2 text-sm rounded-md bg-white hover:bg-slate-50 border border-slate-300 shadow-sm"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
                            <span className="text-xs uppercase tracking-wide text-slate-500">Total</span>
                            <span className="mt-1 text-2xl font-semibold text-slate-800">{stats.total}</span>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
                            <span className="text-xs uppercase tracking-wide text-amber-600">Pending</span>
                            <span className="mt-1 text-2xl font-semibold text-amber-700">{stats.pending}</span>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
                            <span className="text-xs uppercase tracking-wide text-blue-600">Assigned</span>
                            <span className="mt-1 text-2xl font-semibold text-blue-700">{stats.assigned}</span>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
                            <span className="text-xs uppercase tracking-wide text-green-600">Resolved</span>
                            <span className="mt-1 text-2xl font-semibold text-green-700">{stats.resolved}</span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-slate-600 mb-1">Tìm kiếm</label>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Reason, Flagged By, ID..."
                                className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-slate-600 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-slate-600 mb-1">Type</label>
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All</option>
                                <option value="quiz">Quiz</option>
                                <option value="flashcard">Flashcard</option>
                                <option value="report">Report</option>
                                <option value="mindmap">Mindmap</option>
                                <option value="message">Message</option>
                            </select>
                        </div>
                        {loading && <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">ID</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Type</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Reason</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Priority</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Flagged By</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Flagged At</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Assigned To</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filtered.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{item.id}</td>
                                    <td className="px-4 py-2">
                                        <span className="inline-flex items-center gap-1">
                                            {getTypeIcon(item.type)} {item.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 max-w-xs">
                                        <div className="truncate" title={item.reason}>{item.reason || '(no reason)'}</div>
                                    </td>
                                    <td className="px-4 py-2">{getPriorityBadge(item.priority)}</td>
                                    <td className="px-4 py-2">{item.flaggedByName}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-600">
                                        {new Date(item.flaggedAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-2">{item.assignedToName || '-'}</td>
                                    <td className="px-4 py-2">{getStatusBadge(item.status)}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            {item.status.toLowerCase() === 'pending' && (
                                                <button
                                                    onClick={() => handleAssignClick(item.id)}
                                                    className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                                >
                                                    Assign Faculty
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <div className="text-sm">Không có kết quả phù hợp.</div>
                                            <button
                                                onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Xóa bộ lọc
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Faculty Modal */}
            {selectedFlagId && (
                <AssignFacultyModal
                    isOpen={isModalOpen}
                    flagId={selectedFlagId}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedFlagId(null);
                    }}
                    onSuccess={handleAssignSuccess}
                />
            )}
        </AdminPageWrapper>
    );
}
