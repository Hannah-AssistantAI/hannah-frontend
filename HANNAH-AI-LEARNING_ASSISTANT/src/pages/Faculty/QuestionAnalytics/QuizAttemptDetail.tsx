import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuizAttemptDetail } from '../../../service/mockApi';
import { useApp } from '../../../contexts/AppContext';
import { ArrowLeft, CheckCircle2, XCircle, User, BookOpen, Calendar, ListChecks, Gauge, Award, Printer } from 'lucide-react';

interface AttemptQuestion {
  id: string;
  content: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  explanation?: string;
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
  questionsCount: number;
  timestamp: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: AttemptQuestion[];
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 80) return '#10b981'; // green
  if (percentage >= 60) return '#f59e0b'; // orange
  return '#ef4444'; // red
};

const getDiffBadge = (diff: 'easy' | 'medium' | 'hard') => {
  switch (diff) {
    case 'easy':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-red-100 text-red-800';
  }
};

export default function QuizAttemptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setLoading, showNotification } = useApp();
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getQuizAttemptDetail(String(id));
        if ((res as any).success) {
          setDetail((res as any).data as AttemptDetail);
        } else {
          showNotification('Quiz attempt data not found', 'error');
        }
      } catch (e) {
        showNotification('Failed to load quiz attempt details', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, setLoading, showNotification]);

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
          {/* <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50"
            >
              <Printer className="w-4 h-4" /> In
            </button>
          </div> */}
        </div>

        {/* Header card */}
        <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {detail.studentName.split(' ').slice(-1)[0][0]}
                </div>
                <h1 className="text-2xl font-bold text-slate-800">{detail.studentName}</h1>
              </div>
              <div className="text-sm text-slate-500">{detail.studentId} • {detail.course} • {detail.topic}</div>
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
                <div className="text-xs text-slate-500">Student</div>
                <div className="font-semibold text-slate-800">{detail.studentId}</div>
              </div>
              <User className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Course</div>
                <div className="font-semibold text-slate-800">{detail.course}</div>
              </div>
              <BookOpen className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Questions</div>
                <div className="font-semibold text-slate-800">{detail.questionsCount}</div>
              </div>
              <ListChecks className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Time</div>
                <div className="font-semibold text-slate-800">{new Date(detail.timestamp).toLocaleString('en-US')}</div>
              </div>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Difficulty</div>
                <div>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getDiffBadge(detail.difficulty)}`}>
                    {detail.difficulty === 'easy' ? 'Easy' : detail.difficulty === 'medium' ? 'Medium' : 'Hard'}
                  </span>
                </div>
              </div>
              <Gauge className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm lg:col-span-2">
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
              {detail.questions.map((q, idx) => {
                const isCorrect = q.selectedIndex === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-sm flex items-center justify-center font-semibold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 mb-2">{q.content}</div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2" style={{width: '60vw'}}>
                            {q.options.map((opt, i) => {
                              const isSel = i === q.selectedIndex;
                              const isAns = i === q.correctIndex;
                              return (
                                <div
                                  key={i}
                                  className={`px-3 py-2 rounded border text-sm w-full h-full ${
                                    isAns ? 'border-green-300 bg-green-50' : isSel ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'
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
  );
}
