import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertCircle, Clock, Users, Target } from 'lucide-react';
import { getFlaggedQuizAttempts } from '../../../service/mockApi';
import QuestionAnalyticsFilter from './QuestionAnalyticsFilter';
import quizApiService from '../../../service/quizApi';
import {
  formatTime,
  getScoreRangeLabel,
  getScoreRangeColor
} from '../../../service/quizApi';
import type {
  QuizDto,
  QuizResultsDto,
  QuizStatisticsDto
} from '../../../service/quizApi';

// ==================== INTERFACES ====================

interface QuizWithAnalytics extends QuizDto {
  results?: QuizResultsDto;
  statistics?: QuizStatisticsDto;
}

interface AnalyticsData {
  quizzes: QuizWithAnalytics[];
  totalAttempts: number;
  averageScore: number;
  totalQuizzes: number;
  totalStudents: number;
}

interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  course: string;
  timePeriod: string;
  scoreFilter: string;
}

// ==================== MAIN COMPONENT ====================

const QuestionAnalytics = () => {
  const { setLoading, showNotification } = useApp();
  const { user } = useAuth(); // Get user from context
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateFrom: '',
    dateTo: '',
    course: '',
    timePeriod: 'all',
    scoreFilter: 'all'
  });

  // Available courses
  const [availableCourses] = useState<string[]>([]);

  // Flagged quizzes
  const [flaggedMap, setFlaggedMap] = useState<Record<string, { reason: string; status: string }>>({});

  // ==================== DATA LOADING ====================

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [filters.timePeriod, filters.scoreFilter, user]);

  const refreshFlags = async () => {
    const res = await getFlaggedQuizAttempts();
    if (res.success) {
      const map: Record<string, { reason: string; status: string }> = {};
      res.data.forEach((f: any) => {
        map[f.id] = { reason: f.reason, status: f.status };
      });
      setFlaggedMap(map);
    }
  };

  useEffect(() => {
    if (analyticsData) refreshFlags();
  }, [analyticsData]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all quizzes (no CreatedBy filter)
      // Faculty can see all quizzes in the system
      const params = {
        PageSize: 100,
      };

      const quizzesWithStats = await quizApiService.getQuizzesWithStatistics(params);

      // Calculate aggregate statistics
      let totalAttempts = 0;
      let totalScore = 0;
      let scoreCount = 0;
      const uniqueStudents = new Set<number>();

      quizzesWithStats.forEach(quiz => {
        if (quiz.results) {
          totalAttempts += quiz.results.totalAttempts;
          uniqueStudents.add(quiz.results.uniqueUsers);

          if (quiz.results.averageScore !== undefined) {
            totalScore += quiz.results.averageScore;
            scoreCount++;
          }
        }
      });

      setAnalyticsData({
        quizzes: quizzesWithStats,
        totalAttempts,
        averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        totalQuizzes: quizzesWithStats.length,
        totalStudents: uniqueStudents.size,
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load quiz analytics');
      showNotification('Error loading analytics data', 'error');
      setLoading(false);
    }
  };

  // ==================== FILTERS ====================

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      course: '',
      timePeriod: 'all',
      scoreFilter: 'all'
    });
  };

  const filterQuizzes = (quizzes: QuizWithAnalytics[]): QuizWithAnalytics[] => {
    let filtered = [...quizzes];

    if (filters.scoreFilter !== 'all') {
      filtered = filtered.filter(quiz => {
        const avgScore = quiz.results?.averageScore || 0;
        if (filters.scoreFilter === 'low') return avgScore < 60;
        if (filters.scoreFilter === 'medium') return avgScore >= 60 && avgScore < 80;
        if (filters.scoreFilter === 'high') return avgScore >= 80;
        return true;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchLower)
      );
    }

    if (filters.timePeriod !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(quiz => {
        const quizDate = new Date(quiz.createdAt);

        switch (filters.timePeriod) {
          case 'today':
            return quizDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return quizDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return quizDate >= monthAgo;
          case 'semester':
            const semesterAgo = new Date(today);
            semesterAgo.setMonth(semesterAgo.getMonth() - 4);
            return quizDate >= semesterAgo;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return quizDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(q => new Date(q.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(q => new Date(q.createdAt) <= toDate);
    }

    return filtered;
  };

  // ==================== HELPER FUNCTIONS ====================

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // ==================== RENDER ====================

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600">Loading quiz analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Analytics</h2>
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredQuizzes = filterQuizzes(analyticsData.quizzes);

  let filteredTotalAttempts = 0;
  let filteredTotalScore = 0;
  let filteredScoreCount = 0;

  filteredQuizzes.forEach(quiz => {
    if (quiz.results) {
      filteredTotalAttempts += quiz.results.totalAttempts;
      if (quiz.results.averageScore !== undefined) {
        filteredTotalScore += quiz.results.averageScore;
        filteredScoreCount++;
      }
    }
  });

  const filteredAverageScore = filteredScoreCount > 0 ? filteredTotalScore / filteredScoreCount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">📊 Quiz Analytics Dashboard</h1>
          <p className="text-slate-600">Comprehensive analytics for all quizzes</p>
        </div>

        {/* Filter Component */}
        <QuestionAnalyticsFilter
          filters={filters}
          courses={availableCourses}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Quizzes</p>
                <p className="text-4xl font-bold">{filteredQuizzes.length}</p>
                {filteredQuizzes.length !== analyticsData.totalQuizzes && (
                  <p className="text-blue-200 text-xs mt-1">
                    (Overall: {analyticsData.totalQuizzes})
                  </p>
                )}
              </div>
              <div className="text-6xl opacity-20">📝</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Total Attempts</p>
                <p className="text-4xl font-bold">{filteredTotalAttempts}</p>
                {filteredTotalAttempts !== analyticsData.totalAttempts && (
                  <p className="text-purple-200 text-xs mt-1">
                    (Overall: {analyticsData.totalAttempts})
                  </p>
                )}
              </div>
              <div className="text-6xl opacity-20">✍️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Average Score</p>
                <p className="text-4xl font-bold">{filteredAverageScore.toFixed(1)}%</p>
                {filteredAverageScore.toFixed(1) !== analyticsData.averageScore.toFixed(1) && (
                  <p className="text-green-200 text-xs mt-1">
                    (Overall: {analyticsData.averageScore.toFixed(1)}%)
                  </p>
                )}
              </div>
              <div className="text-6xl opacity-20">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Total Students</p>
                <p className="text-4xl font-bold">{analyticsData.totalStudents}</p>
              </div>
              <div className="text-6xl opacity-20">👥</div>
            </div>
          </div>
        </div>

        {/* Quiz List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">📋 Quiz Performance Overview</h2>
            <button
              onClick={loadAnalyticsData}
              className="text-sm px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300"
            >
              Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Quiz Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Questions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Attempts</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Avg Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Pass Rate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Students</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Avg Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredQuizzes.map((quiz) => (
                  <tr key={quiz.quizId} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          {quiz.title}
                          {flaggedMap[quiz.quizId] && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs"
                              title={flaggedMap[quiz.quizId].reason || 'Flagged'}
                            >
                              🚩 Flagged
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          Created: {new Date(quiz.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{quiz.questionCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-blue-600">{quiz.results?.totalAttempts || 0}</div>
                        {quiz.statistics && (
                          <div className="text-xs text-slate-500">
                            ({quiz.statistics.completedAttempts} completed)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: getScoreColor(quiz.results?.averageScore || 0) }}
                      >
                        {quiz.results?.averageScore != null ? `${quiz.results.averageScore.toFixed(1)}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-700">
                          {quiz.results?.passRate != null ? `${quiz.results.passRate.toFixed(1)}%` : 'N/A'}
                        </div>
                        {quiz.results && (
                          <div className="text-xs text-slate-500">
                            (≥50 points)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-700">{quiz.results?.uniqueUsers || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">
                          {formatTime(quiz.results?.averageTimeTaken)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/faculty/analytics/quiz/${quiz.quizId}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuizzes.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No quizzes match the filters</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Score Distribution */}
        {filteredQuizzes.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">📊 Score Distribution</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {['90-100', '80-89', '70-79', '60-69', '0-59'].map((range) => {
                const totalInRange = filteredQuizzes.reduce((sum, quiz) => {
                  return sum + (quiz.results?.scoreDistribution[range as keyof typeof quiz.results.scoreDistribution] || 0);
                }, 0);

                return (
                  <div
                    key={range}
                    className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
                    style={{ borderColor: getScoreRangeColor(range) }}
                  >
                    <div className="text-center">
                      <div
                        className="text-3xl font-bold mb-1"
                        style={{ color: getScoreRangeColor(range) }}
                      >
                        {totalInRange}
                      </div>
                      <div className="text-sm font-medium text-slate-700 mb-1">
                        {getScoreRangeLabel(range)}
                      </div>
                      <div className="text-xs text-slate-500">{range} points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionAnalytics;
