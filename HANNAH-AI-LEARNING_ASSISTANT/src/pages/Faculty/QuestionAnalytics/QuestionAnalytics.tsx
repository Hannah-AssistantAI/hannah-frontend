import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertCircle, Users, Target } from 'lucide-react';
import { getFlaggedQuizAttempts } from '../../../service/mockApi';
import QuestionAnalyticsFilter from './QuestionAnalyticsFilter';
import quizApiService from '../../../service/quizApi';
import type {
  QuizDto,
  QuizResultsDto,
  QuizStatisticsDto,
  QuizAttemptDto
} from '../../../service/quizApi';
import TopicPerformanceChart from '../../../components/Charts/TopicPerformanceChart';
import KnowledgeGapHeatmap from '../../../components/Charts/KnowledgeGapHeatmap';

// ==================== INTERFACES ====================

interface QuizWithAnalytics extends QuizDto {
  results?: QuizResultsDto;
  statistics?: QuizStatisticsDto;
  topics?: string[];  // Inherited from QuizDto but explicit for clarity
}

interface QuizAttemptWithTitle extends QuizAttemptDto {
  quizTitle: string;
  quizId: number;
}

interface AnalyticsData {
  quizzes: QuizWithAnalytics[];
  allAttempts: QuizAttemptWithTitle[];
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
  selectedMonth: string; // Format: 'YYYY-MM' or '' for all
  subjectSearch: string;
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
    scoreFilter: 'all',
    selectedMonth: '',
    subjectSearch: ''
  });

  // Generate last 12 months for dropdown
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

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

      // Fetch all quizzes
      const params = {
        PageSize: 100,
      };

      const quizzesWithStats = await quizApiService.getQuizzesWithStatistics(params);

      // Fetch attempts for all quizzes in parallel
      const attemptsPromises = quizzesWithStats.map(quiz =>
        quizApiService.getQuizAttempts(quiz.quizId)
          .then(attempts => ({ quizId: quiz.quizId, title: quiz.title, attempts }))
          .catch(err => {
            console.warn(`Failed to load attempts for quiz ${quiz.quizId}`, err);
            return { quizId: quiz.quizId, title: quiz.title, attempts: [] as QuizAttemptDto[] };
          })
      );

      const quizzesAttemptsResults = await Promise.all(attemptsPromises);

      // Flatten attempts
      const allAttempts: QuizAttemptWithTitle[] = [];
      const uniqueStudents = new Set<number>();

      quizzesAttemptsResults.forEach(item => {
        item.attempts.forEach(att => {
          allAttempts.push({
            ...att,
            quizTitle: item.title,
            quizId: item.quizId
          });
          uniqueStudents.add(att.userId);
        });
      });

      // Calculate aggregate statistics
      let totalAttempts = 0;
      let totalScore = 0;
      let scoreCount = 0;

      quizzesWithStats.forEach(quiz => {
        if (quiz.results) {
          totalAttempts += quiz.results.totalAttempts;
          if (quiz.results.averageScore !== undefined) {
            totalScore += quiz.results.averageScore;
            scoreCount++;
          }
        }
      });

      setAnalyticsData({
        quizzes: quizzesWithStats,
        allAttempts,
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
      scoreFilter: 'all',
      selectedMonth: '',
      subjectSearch: ''
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

    // Filter by specific month
    if (filters.selectedMonth) {
      const [year, month] = filters.selectedMonth.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      filtered = filtered.filter(q => {
        const quizDate = new Date(q.createdAt);
        return quizDate >= monthStart && quizDate <= monthEnd;
      });
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

  // Group filtered quizzes by title
  const groupedQuizzes = filteredQuizzes.reduce((acc, quiz) => {
    if (!acc[quiz.title]) {
      acc[quiz.title] = {
        title: quiz.title,
        quizIds: [] as number[],
        questionCount: quiz.questionCount,
        totalAttempts: 0,
        totalScoreSum: 0,
        totalTimeSum: 0,
        uniqueUsersSum: 0,
        createdAt: quiz.createdAt,
        passCount: 0
      };
    }
    const group = acc[quiz.title];
    group.quizIds.push(quiz.quizId);

    if (quiz.results) {
      group.totalAttempts += quiz.results.totalAttempts;
      if (quiz.results.averageScore !== undefined) {
        group.totalScoreSum += (quiz.results.averageScore * quiz.results.totalAttempts);
      }
      if (quiz.results.averageTimeTaken !== undefined) {
        group.totalTimeSum += (quiz.results.averageTimeTaken * quiz.results.totalAttempts);
      }
      group.uniqueUsersSum += quiz.results.uniqueUsers;

      // Estimate pass count
      if (quiz.results.passRate !== undefined) {
        group.passCount += (quiz.results.passRate * quiz.results.totalAttempts / 100);
      }
    }

    // Keep the most recent creation date
    if (new Date(quiz.createdAt) > new Date(group.createdAt)) {
      group.createdAt = quiz.createdAt;
    }

    return acc;
  }, {} as Record<string, any>);

  // Filter attempts based on filtered quizzes
  const filteredQuizIds = new Set(filteredQuizzes.map(q => q.quizId));
  const filteredAttempts = analyticsData.allAttempts.filter(att => filteredQuizIds.has(att.quizId));

  const aggregatedQuizList = Object.values(groupedQuizzes).map(g => {
    // Calculate unique students for this group using allAttempts
    const groupAttempts = analyticsData.allAttempts.filter(att => g.quizIds.includes(att.quizId));
    const uniqueStudents = new Set(groupAttempts.map(a => a.userId)).size;

    // Check if any quiz in the group is flagged
    const isFlagged = g.quizIds.some((id: string | number) => flaggedMap[id]);
    const flagReason = isFlagged ? g.quizIds.map((id: string | number) => flaggedMap[id]?.reason).filter(Boolean).join(', ') : '';

    return {
      ...g,
      averageScore: g.totalAttempts > 0 ? g.totalScoreSum / g.totalAttempts : 0,
      averageTime: g.totalAttempts > 0 ? g.totalTimeSum / g.totalAttempts : 0,
      passRate: g.totalAttempts > 0 ? (g.passCount / g.totalAttempts * 100) : 0,
      uniqueStudents,
      isFlagged,
      flagReason
    };
  }).sort((a, b) => b.totalAttempts - a.totalAttempts);

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
          monthOptions={getMonthOptions()}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Quizzes</p>
                <p className="text-3xl font-bold text-slate-800">{analyticsData.totalQuizzes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Attempts</p>
                <p className="text-3xl font-bold text-slate-800">{analyticsData.totalAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Average Score</p>
                <p className="text-3xl font-bold" style={{ color: getScoreColor(analyticsData.averageScore) }}>
                  {analyticsData.averageScore.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Students</p>
                <p className="text-3xl font-bold text-slate-800">{analyticsData.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Topic-Based Analytics */}
        {(() => {
          // Extract topic performance from quiz data
          const topicMap = new Map<string, { totalScore: number; count: number; passCount: number; totalAttempts: number }>();

          // 🔍 DEBUG: Check topics from API
          console.log('🔍 Filtered Quizzes:', filteredQuizzes.map(q => ({
            id: q.quizId,
            title: q.title,
            topics: q.topics
          })));

          // ✅ Helper: Check if topic is a valid subject code (not generic)
          const isValidSubjectCode = (topic: string): boolean => {
            const invalidTopics = ['General Knowledge', 'General', 'N/A', '', 'undefined'];
            return !invalidTopics.includes(topic) && topic.length > 0;
          };

          // ✅ FILTER: Only process quizzes with valid subject code topics
          const quizzesWithSubjectTopics = filteredQuizzes.filter(quiz => {
            return quiz.topics && quiz.topics.length > 0 && quiz.topics.some(isValidSubjectCode);
          });

          console.log(`📊 Quizzes with subject codes: ${quizzesWithSubjectTopics.length}/${filteredQuizzes.length}`);

          quizzesWithSubjectTopics.forEach(quiz => {
            // ✨ Use topics from API (subject code) - already filtered
            const topicsList = quiz.topics || [];

            // Process each VALID topic only
            topicsList.forEach((topicName: string) => {
              if (!isValidSubjectCode(topicName)) return; // Skip invalid topics

              if (quiz.results) {
                const existing = topicMap.get(topicName) || { totalScore: 0, count: 0, passCount: 0, totalAttempts: 0 };
                topicMap.set(topicName, {
                  totalScore: existing.totalScore + (quiz.results.averageScore || 0),
                  count: existing.count + 1,
                  passCount: existing.passCount + (quiz.results.passRate || 0),
                  totalAttempts: existing.totalAttempts + quiz.results.totalAttempts
                });
              }
            });
          });

          const topicPerformanceData = Array.from(topicMap.entries()).map(([topic, data]) => ({
            topic,
            averageScore: data.count > 0 ? data.totalScore / data.count : 0,
            passRate: data.count > 0 ? data.passCount / data.count : 0,
            totalAttempts: data.totalAttempts
          }));

          const knowledgeGaps = topicPerformanceData.map(item => ({
            ...item,
            failRate: 100 - item.passRate
          }));

          // ✅ FILTER: Apply subject search if provided
          const filteredTopicData = filters.subjectSearch.trim()
            ? topicPerformanceData.filter(item =>
              item.topic.toLowerCase().includes(filters.subjectSearch.toLowerCase())
            )
            : topicPerformanceData;

          const filteredKnowledgeGaps = filters.subjectSearch.trim()
            ? knowledgeGaps.filter(item =>
              item.topic.toLowerCase().includes(filters.subjectSearch.toLowerCase())
            )
            : knowledgeGaps;

          return (
            <>
              {/* Topic Performance Chart - Only show if data exists */}
              {filteredTopicData.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">📊 Performance by Topic</h2>
                      <p className="text-sm text-slate-600 mt-1">Compare average scores and pass rates across different topics</p>
                    </div>
                  </div>
                  <TopicPerformanceChart data={filteredTopicData} />
                </div>
              )}

              {/* Knowledge Gap Heatmap - Always show with month filter */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">🎯 Knowledge Gaps</h2>
                    <p className="text-sm text-slate-600 mt-1">Topics where students need more support (score &lt; 60%)</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    Threshold: <span className="font-semibold">60%</span>
                  </div>
                </div>
                {filteredKnowledgeGaps.length > 0 ? (
                  <KnowledgeGapHeatmap gaps={filteredKnowledgeGaps} threshold={60} />
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-500">
                    <div className="text-center">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-lg font-medium mb-1">No data for {filters.selectedMonth ? 'this month' : 'the selected filters'}</p>
                      <p className="text-sm">Try selecting a different time period or reset filters</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Quiz List (Grouped by Title) */}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Total Attempts</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Avg Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Pass Rate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Students</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {aggregatedQuizList.map((group) => (
                  <tr key={group.title} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          {group.title}
                        </div>
                        <div className="text-sm text-slate-500">
                          Last Updated: {new Date(group.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{group.questionCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-600">{group.totalAttempts}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${group.averageScore >= 80
                            ? 'bg-green-100 text-green-800'
                            : group.averageScore >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {group.averageScore.toFixed(1)}%
                        {group.averageScore >= 80 && <span className="ml-1">✓</span>}
                        {group.averageScore < 60 && <span className="ml-1">⚠</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${group.passRate >= 80
                            ? 'bg-green-100 text-green-800'
                            : group.passRate >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {group.passRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-700">{group.uniqueStudents}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (group.quizIds.length > 0) {
                            navigate(`/faculty/analytics/quiz/${group.quizIds[0]}`);
                          }
                        }}
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

          {aggregatedQuizList.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No quizzes match the filters</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Student Performance (All Attempts) */}
        {filteredAttempts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">🎓 Student Performance</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Quiz Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Submitted At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAttempts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).map((attempt) => (
                    <tr
                      key={attempt.attemptId}
                      className="hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => navigate(`/faculty/analytics/quiz/${attempt.quizId}/attempt/${attempt.attemptId}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {attempt.userName ? attempt.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-medium text-slate-700">{attempt.userName || `User #${attempt.userId}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{attempt.quizTitle}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="font-bold"
                          style={{ color: getScoreColor(attempt.score || 0) }}
                        >
                          {attempt.score !== undefined ? `${attempt.score}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${attempt.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {attempt.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionAnalytics;
