import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, FileText, BarChart2, Calendar } from 'lucide-react';
import quizApiService, { type QuizDetailDto, type QuizStatisticsDto, type QuizAttemptDto } from '../../../service/quizApi';
import { useApp } from '../../../contexts/AppContext';
import { formatDateVN, formatDateTimeVN } from '../../../utils/dateUtils';

const QuizDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setLoading, showNotification } = useApp();
    const [quiz, setQuiz] = useState<QuizDetailDto | null>(null);
    const [stats, setStats] = useState<QuizStatisticsDto | null>(null);
    const [attempts, setAttempts] = useState<QuizAttemptDto[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const quizId = parseInt(id);

                // Fetch data in parallel
                const [quizData, statsData, attemptsData] = await Promise.all([
                    quizApiService.getQuizById(quizId),
                    quizApiService.getQuizStatistics(quizId).catch(() => null),
                    quizApiService.getQuizAttempts(quizId).catch(() => [])
                ]);

                setQuiz(quizData);
                setStats(statsData);
                setAttempts(attemptsData || []);
            } catch (error) {
                console.error(error);
                showNotification('Failed to load quiz details', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, setLoading, showNotification]);

    if (!quiz) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 mb-6 hover:text-slate-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 transition-colors"
                >
                    <ArrowLeft size={18} /> Back to Analytics
                </button>

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
                            <p className="text-slate-500 mb-4">{quiz.description || 'No description available.'}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><FileText size={16} /> {quiz.questionCount} Questions</span>
                                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Users size={16} /> {quiz.attemptCount} Attempts</span>
                                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Calendar size={16} /> {formatDateVN(quiz.createdAt)}</span>
                                {quiz.timeLimitMinutes && (
                                    <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Clock size={16} /> {quiz.timeLimitMinutes} mins limit</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">Average Score</div>
                            <div className={`text-4xl font-bold ${(stats?.averageScore || 0) >= 80 ? 'text-green-600' :
                                (stats?.averageScore || 0) >= 60 ? 'text-blue-600' :
                                    (stats?.averageScore || 0) >= 40 ? 'text-orange-500' : 'text-red-500'
                                }`}>
                                {stats?.averageScore?.toFixed(1) || 'N/A'}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-500 text-sm font-medium">Pass Rate</h3>
                            <BarChart2 className="text-blue-500 opacity-50" size={20} />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">
                            {stats?.completedAttempts ?
                                `${Math.round((stats.completedAttempts / stats.totalAttempts) * 100)}%` :
                                'N/A'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Completion rate</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-500 text-sm font-medium">Completed Attempts</h3>
                            <Users className="text-green-500 opacity-50" size={20} />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stats?.completedAttempts || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Total finished sessions</p>
                    </div>
                </div>

                {/* Attempts List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Student Attempts</h2>
                        <span className="text-sm text-slate-500">{attempts.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {attempts.map((attempt) => (
                                    <tr key={attempt.attemptId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                                    {(attempt.userName || 'U').charAt(0)}
                                                </div>
                                                <div className="text-sm font-medium text-slate-900">{attempt.userName || `User #${attempt.userId}`}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attempt.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {attempt.isCompleted ? 'Completed' : 'In Progress'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm font-bold ${(attempt.score || 0) >= 80 ? 'text-green-600' :
                                                (attempt.score || 0) < 50 ? 'text-red-500' : 'text-slate-700'
                                                }`}>
                                                {attempt.score != null ? `${attempt.score}%` : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {attempt.submittedAt ? formatDateTimeVN(attempt.submittedAt) : formatDateTimeVN(attempt.startedAt)}
                                        </td>
                                    </tr>
                                ))}
                                {attempts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users size={48} className="text-slate-200 mb-2" />
                                                <p>No attempts recorded yet for this quiz.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizDetail;
