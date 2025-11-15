import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFlaggedQuizAttempts, getQuizAttemptDetail, unflagQuizAttempt } from '../../service/mockApi';
import AdminPageWrapper from './components/AdminPageWrapper';

interface FlaggedQuizRow {
  id: string;
  reason: string;
  flaggedAt: string;
  status: 'pending' | 'resolved';
  studentName?: string;
  topic?: string;
  course?: string;
}

export default function FlaggedQuizzes() {
  const [rows, setRows] = useState<FlaggedQuizRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFlaggedQuizAttempts();
      if (res.success) {
        const enriched: FlaggedQuizRow[] = [];
        for (const r of res.data as any[]) {
          const detail = await getQuizAttemptDetail(r.id);
          enriched.push({
            id: r.id,
            reason: r.reason,
            flaggedAt: r.flaggedAt,
            status: r.status,
            studentName: detail.success ? (detail as any).data.studentName : undefined,
            topic: detail.success ? (detail as any).data.topic : undefined,
            course: detail.success ? (detail as any).data.course : undefined
          });
        }
        setRows(enriched);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter(r => {
      const matchesSearch = !term || [r.id, r.studentName, r.topic, r.course, r.reason].some(v => (v || '').toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = rows.filter(r => r.status === 'pending').length;
    const resolved = rows.length - pending;
    return { total: rows.length, pending, resolved };
  }, [rows]);

  const unflag = async (id: string) => {
    const res = await unflagQuizAttempt(id);
    if (res.success) {
      setRows(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <AdminPageWrapper title="Flagged Quizzes">
      <div className="p-4 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Flagged Quiz Attempts</h2>
              <p className="text-sm text-slate-500">Quản lý các bài quiz bị gắn cờ để rà soát chất lượng nội dung.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={load}
                className="px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 shadow-sm"
              >Refresh</button>
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
                className="px-3 py-2 text-sm rounded-md bg-white hover:bg-slate-50 border border-slate-300 shadow-sm"
              >Reset</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
              <span className="text-xs uppercase tracking-wide text-slate-500">Total</span>
              <span className="mt-1 text-2xl font-semibold text-slate-800">{stats.total}</span>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
              <span className="text-xs uppercase tracking-wide text-amber-600">Pending</span>
              <span className="mt-1 text-2xl font-semibold text-amber-700">{stats.pending}</span>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
              <span className="text-xs uppercase tracking-wide text-green-600">Resolved</span>
              <span className="mt-1 text-2xl font-semibold text-green-700">{stats.resolved}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600 mb-1">Tìm kiếm</label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ID, Student, Topic, Reason..."
                className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            {loading && <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">ID</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Student</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Topic</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Course</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Reason</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Flagged At</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.id}</td>
                  <td className="px-4 py-2">{r.studentName || '-'}</td>
                  <td className="px-4 py-2">{r.topic || '-'}</td>
                  <td className="px-4 py-2">{r.course || '-'}</td>
                  <td className="px-4 py-2 max-w-xs">
                    <div className="truncate" title={r.reason}>{r.reason || '(no reason)'}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-600">{new Date(r.flaggedAt).toLocaleString('en-US')}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      <span className="inline-block w-2 h-2 rounded-full ${r.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'}"></span>
                      {r.status === 'pending' ? 'Pending' : 'Resolved'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/flagged-quizzes/${r.id}`)}
                        className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      >Detail</button>
                      <button
                        onClick={() => unflag(r.id)}
                        className="px-3 py-1.5 text-xs rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-sm"
                      >Unflag</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <div className="text-sm">Không có kết quả phù hợp.</div>
                      <button
                        onClick={() => { setSearch(''); setStatusFilter('all'); }}
                        className="text-xs text-blue-600 hover:underline"
                      >Xóa bộ lọc</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
