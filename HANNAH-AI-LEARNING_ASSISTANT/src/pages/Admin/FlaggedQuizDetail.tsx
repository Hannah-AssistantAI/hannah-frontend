import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminPageWrapper from './components/AdminPageWrapper';
import { getQuizAttemptDetail, getFlaggedQuizAttemptMeta, resolveFlaggedQuizAttempt } from '../../service/mockApi';

interface AttemptQuestion {
  id: string;
  content: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
}

interface AttemptDetail {
  id: string;
  studentName: string;
  studentId: string;
  topic: string;
  course: string;
  score: number;
  maxScore: number;
  percentage: number;
  timestamp: string;
  difficulty: string;
  questions: AttemptQuestion[];
}

export default function FlaggedQuizDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolutionNote, setResolutionNote] = useState('');
  const [fixAction, setFixAction] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const detailRes = await getQuizAttemptDetail(id);
        if (detailRes.success) {
          setAttempt(detailRes.data as any);
        }
        const flaggedMeta = getFlaggedQuizAttemptMeta(parseInt(id));
        setMeta(flaggedMeta);
        if (flaggedMeta?.resolutionNote) setResolutionNote(flaggedMeta.resolutionNote);
        if (flaggedMeta?.fixAction) setFixAction(flaggedMeta.fixAction);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onResolve = async () => {
    if (!id) return;
    if (!resolutionNote.trim() || !fixAction.trim()) {
      setError('Resolution note and fix action are required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await resolveFlaggedQuizAttempt(id, resolutionNote.trim(), fixAction.trim());
      if (res.success) {
        navigate('/admin/flagged-quizzes');
      } else {
        setError(res.error || 'Failed to resolve.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageWrapper title="Flagged Quiz Detail">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">← Back</button>
          {meta && (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${meta.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>
              {meta.status === 'pending' ? 'Pending Review' : 'Resolved'}
            </span>
          )}
        </div>
        {loading && <div className="text-slate-500">Loading...</div>}
        {!loading && !meta && (
          <div className="text-slate-500">Flag metadata not found.</div>
        )}
        {!loading && meta && attempt && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-5 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Attempt Overview</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">ID:</span> {attempt.id}</div>
                <div><span className="font-medium">Student:</span> {attempt.studentName}</div>
                <div><span className="font-medium">Topic:</span> {attempt.topic}</div>
                <div><span className="font-medium">Course:</span> {attempt.course}</div>
                <div><span className="font-medium">Score:</span> {attempt.score}/{attempt.maxScore} ({attempt.percentage}%)</div>
                <div><span className="font-medium">Difficulty:</span> {attempt.difficulty}</div>
                <div className="col-span-2"><span className="font-medium">Timestamp:</span> {new Date(attempt.timestamp).toLocaleString('en-US')}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                {(() => {
                  const total = attempt.questions.length;
                  const correct = attempt.questions.filter(q => q.selectedIndex === q.correctIndex).length;
                  return (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700">Questions: {total}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700">Correct: {correct}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700">Incorrect: {total - correct}</span>
                    </>
                  );
                })()}
                </div>
              </div>
              <div className="border rounded-lg p-5 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Flag Information</h2>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Status:</span> {meta.status === 'pending' ? 'Pending' : 'Resolved'}</div>
                <div><span className="font-medium">Reason:</span> {meta.reason}</div>
                <div><span className="font-medium">Flagged At:</span> {new Date(meta.flaggedAt).toLocaleString('en-US')}</div>
                {meta.resolvedAt && <div><span className="font-medium">Resolved At:</span> {new Date(meta.resolvedAt).toLocaleString('en-US')}</div>}
              </div>
            </div>
            </div>

            <div className="border rounded-lg p-5 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Questions & Answers ({attempt.questions.length})</h2>
              <div className="space-y-4">
                {attempt.questions.map((q, qi) => {
                  const isCorrect = q.selectedIndex === q.correctIndex;
                  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                  return (
                    <div key={q.id} className={`rounded-lg border shadow-sm ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} overflow-hidden`}> 
                      <div className={`px-4 py-3 flex items-start justify-between border-b text-sm ${isCorrect ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                        <div className="font-medium pr-4">Q{qi + 1}. {q.content}</div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <ul className="p-4 space-y-2 text-sm">
                        {q.options.map((opt, oi) => {
                          const isSel = oi === q.selectedIndex;
                          const isCorr = oi === q.correctIndex;
                          return (
                            <li
                              key={oi}
                              className={`rounded-md border px-3 py-2 flex items-center gap-3 ${isCorr ? 'border-green-400 bg-green-50' : 'border-slate-200'} ${isSel && !isCorr ? 'border-red-400 bg-red-50' : ''}`}
                            >
                              <span className="font-mono text-xs w-5 text-center text-slate-500">{letters[oi]}</span>
                              <span className="flex-1">{opt}</span>
                              {isCorr && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-600 text-white">Answer</span>
                              )}
                              {isSel && !isCorr && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-600 text-white">Selected</span>
                              )}
                              {isSel && isCorr && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">Selected</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border rounded-lg p-5 bg-white shadow-sm lg:sticky lg:top-4">
              <h2 className="text-lg font-semibold mb-2">Resolution Details</h2>
              {meta.status === 'resolved' && (
                <div className="text-sm mb-4 text-green-700">Already resolved.</div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Resolution Note</label>
                  <textarea
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    disabled={meta.status === 'resolved'}
                    className="w-full border rounded-md p-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    placeholder="Describe the issue analysis and findings..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fix Action</label>
                  <textarea
                    value={fixAction}
                    onChange={e => setFixAction(e.target.value)}
                    disabled={meta.status === 'resolved'}
                    className="w-full border rounded-md p-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    placeholder="Outline remediation steps taken..."
                  />
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                {meta.status === 'pending' && (
                  <button
                    onClick={onResolve}
                    disabled={saving}
                    className="px-5 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 shadow-sm"
                  >{saving ? 'Resolving...' : 'Resolve Flag'}</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
