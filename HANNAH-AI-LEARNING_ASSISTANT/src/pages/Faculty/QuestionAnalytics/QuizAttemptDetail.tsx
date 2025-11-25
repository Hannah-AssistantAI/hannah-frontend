import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import { ArrowLeft, CheckCircle2, XCircle, User, BookOpen, Calendar, ListChecks, Award } from 'lucide-react';
import quizApiService from '../../../service/quizApi';
import type { QuizAttemptDetailDto } from '../../../service/quizApi';

const getScoreColor = (percentage: number) => {
  if (percentage >= 80) return '#10b981'; // green
  if (percentage >= 60) return '#f59e0b'; // orange
  return '#ef4444'; // red
};

export default function QuizAttemptDetail() {
  const { quizId, id } = useParams();
  const navigate = useNavigate();
  const { setLoading, showNotification } = useApp();
  const [detail, setDetail] = useState<QuizAttemptDetailDto | null>(null);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [unflagModalOpen, setUnflagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  // Printing not currently used; removed handler.

  useEffect(() => {
    const load = async () => {
      if (!id || !quizId) return;
      try {
        setLoading(true);
        const data = await quizApiService.getQuizAttemptDetail(Number(quizId), Number(id));
        setDetail(data);
        if (data.isFlagged && data.flagReason) {
          setFlagReason(data.flagReason);
        }
      } catch (e) {
        console.error(e);
        showNotification('Failed to load quiz attempt details', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, quizId, setLoading, showNotification]);

  const openFlagModal = () => setFlagModalOpen(true);
  const closeFlagModal = () => { setFlagModalOpen(false); setFlagReason(''); };
  const openUnflagModal = () => setUnflagModalOpen(true);
  const closeUnflagModal = () => setUnflagModalOpen(false);

  const confirmFlag = async () => {
    if (!detail) return;
    try {
      await quizApiService.flagQuizAttempt(detail.attemptId, flagReason.trim());
      setDetail(prev => prev ? { ...prev, isFlagged: true, flagReason: flagReason.trim() } : null);
      showNotification('Quiz attempt flagged for admin review', 'success');
    } catch (e) {
      showNotification('Failed to flag attempt', 'error');
    } finally {
      closeFlagModal();
    }
  };

  const confirmUnflag = async () => {
    if (!detail) return;
    try {
      await quizApiService.unflagQuizAttempt(detail.attemptId);
      setDetail(prev => prev ? { ...prev, isFlagged: false, flagReason: undefined } : null);
      showNotification('Flag removed', 'success');
    } catch (e) {
      showNotification('Failed to remove flag', 'error');
    } finally {
      closeUnflagModal();
    }
  };

  if (!detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              {/* <div className="text-sm text-slate-500">Khoa • Phân tích kiến thức • Chi tiết bài làm</div> */}
            </div>
            <div className="flex items-center gap-2">
              {!detail.isFlagged && (
                <button
                  onClick={openFlagModal}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 shadow-sm text-red-700 hover:bg-red-100"
                >
                  <span className="text-sm">🚩 Flag quiz</span>
                </button>
              )}
              {detail.isFlagged && (
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm" title={detail.flagReason}>
                    🚩 Flagged
                  </div>
                  <button
                    onClick={openUnflagModal}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-200 text-sm"
                  >Unflag</button>
                </div>
              )}
            </div>
          </div>

          {/* Header card */}
          <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {detail.userName ? detail.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800">{detail.userName || `User #${detail.userId}`}</h1>
                </div>
                <div className="text-sm text-slate-500">ID: {detail.userId} • {detail.courseName || 'N/A'} • {detail.quizTitle}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Score</div>
                <div className="text-3xl font-extrabold" style={{ color: getScoreColor(detail.percentage) }}>
                  {detail.score} ({detail.percentage}%)
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Student ID</div>
                  <div className="font-semibold text-slate-800">{detail.userId}</div>
                </div>
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Course</div>
                  <div className="font-semibold text-slate-800">{detail.courseName || 'N/A'}</div>
                </div>
                <BookOpen className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Questions</div>
                  <div className="font-semibold text-slate-800">{detail.totalQuestions || 0}</div>
                </div>
                <ListChecks className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Submitted At</div>
                  <div className="font-semibold text-slate-800">{detail.completedAt ? new Date(detail.completedAt).toLocaleString('vi-VN') : 'In Progress'}</div>
                </div>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm lg:col-span-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Evaluation</div>
                  <div className="font-semibold text-slate-800">{detail.percentage >= 80 ? 'Good' : detail.percentage >= 60 ? 'Pass' : 'Needs improvement'}</div>
                </div>
                <Award className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-200 inline-block"></span> Correct</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-200 inline-block"></span> Incorrect</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-200 inline-block"></span> Selected</div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Questions and selected answers</h2>
              <div className="space-y-5">
                {detail.questions?.map((q, idx) => {
                  const isCorrect = q.isCorrect;
                  return (
                    <div
                      key={q.questionId}
                      className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-sm flex items-center justify-center font-semibold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 mb-2">{q.content}</div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ width: '45vw' }}>
                              {q.options.map((opt, i) => {
                                const isSel = i === q.selectedOptionIndex;
                                const isAns = i === q.correctOptionIndex;
                                return (
                                  <div
                                    key={i}
                                    className={`px-3 py-2 rounded border text-sm w-full h-full ${isAns ? 'border-green-300 bg-green-50' : isSel ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'
                                      }`}
                                  >
                                    <div className="flex items-start justify-between gap-3 w-full">
                                      <div className="flex items-start gap-2 min-w-0">
                                        {isSel && <span className="text-blue-700 text-xs font-semibold shrink-0">Selected</span>}
                                        <div className="text-slate-800 break-words whitespace-normal leading-relaxed min-w-0">
                                          {opt}
                                        </div>
                                      </div>
                                      {isAns && (
                                        <span className="text-green-700 text-xs font-semibold w-28 text-right shrink-0">Correct answer</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {q.explanation && (
                              <div className="mt-3 text-xs sm:text-sm text-slate-600">
                                <span className="font-semibold">Explanation: </span>{q.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {flagModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm flag</h3>
            <p className="text-sm text-slate-600 mb-4">Provide a brief reason why this quiz attempt is not OK for admin review.</p>
            <textarea
              className="w-full h-28 border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Reason (optional but helps admin)"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeFlagModal}
                className="px-3 py-2 text-sm rounded border bg-slate-50 hover:bg-slate-100"
              >Cancel</button>
              <button
                onClick={confirmFlag}
                disabled={detail?.isFlagged}
                className="px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >Submit flag</button>
            </div>
          </div>
        </div>
      )}
      {unflagModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Remove flag</h3>
            <p className="text-sm text-slate-600 mb-4">Bạn có chắc muốn gỡ cờ khỏi bài quiz này?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeUnflagModal}
                className="px-3 py-2 text-sm rounded border bg-slate-50 hover:bg-slate-100"
              >Cancel</button>
              <button
                onClick={confirmUnflag}
                className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >Remove flag</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
