import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getFlaggedQuizAttempts } from '../../../service/mockApi';
import QuestionAnalyticsFilter from './QuestionAnalyticsFilter';

// Knowledge Gap Analytics - Based on Quiz Performance from Learn Studio
interface QuizAttempt {
  id: number;
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
}

interface TopicGapData {
  topic: string;
  course: string;
  attemptCount: number;
  avgScore: number;
  studentCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface KnowledgeGapData {
  topTopics: TopicGapData[];
  recentQuizzes: QuizAttempt[];
  totalAttempts: number;
  averageScore: number;
}

interface KnowledgeGapData {
  topTopics: TopicGapData[];
  recentQuizzes: QuizAttempt[];
  totalAttempts: number;
  averageScore: number;
}

const KnowledgeGapAnalysis = () => {
  const { setLoading, showNotification } = useApp();
  const navigate = useNavigate();
  const [gapData, setGapData] = useState<KnowledgeGapData | null>(null);
  // const [selectedQuiz, setSelectedQuiz] = useState<QuizAttempt | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    course: '',
    timePeriod: 'all',
    scoreFilter: 'all'
  });

  // Available courses from mock data
  const availableCourses = ['Software Engineering', 'Database Systems', 'Data Structures'];

  // Mock data - Replace with API call
  const mockData: KnowledgeGapData = {
    topTopics: [
      { topic: 'Recursion', course: 'Software Engineering', attemptCount: 45, avgScore: 65, studentCount: 28, trend: 'down' },
      { topic: 'SQL Joins', course: 'Database Systems', attemptCount: 38, avgScore: 72, studentCount: 25, trend: 'stable' },
      { topic: 'Sorting Algorithms', course: 'Data Structures', attemptCount: 32, avgScore: 78, studentCount: 22, trend: 'up' },
      { topic: 'OOP Principles', course: 'Software Engineering', attemptCount: 29, avgScore: 69, studentCount: 20, trend: 'down' },
      { topic: 'Normalization', course: 'Database Systems', attemptCount: 24, avgScore: 74, studentCount: 18, trend: 'stable' }
    ],
    recentQuizzes: [
      { id: 1, studentName: 'Nguyễn Văn A', studentId: 'SE123456', topic: 'Recursion', course: 'Software Engineering', score: 7, maxScore: 10, percentage: 70, questionsCount: 10, timestamp: '2024-10-22T14:30:00', difficulty: 'hard' },
      { id: 2, studentName: 'Trần Thị B', studentId: 'SE123457', topic: 'SQL Joins', course: 'Database Systems', score: 8, maxScore: 10, percentage: 80, questionsCount: 10, timestamp: '2024-10-22T13:15:00', difficulty: 'medium' },
      { id: 3, studentName: 'Lê Văn C', studentId: 'SE123458', topic: 'Sorting Algorithms', course: 'Data Structures', score: 6, maxScore: 10, percentage: 60, questionsCount: 10, timestamp: '2024-10-22T11:45:00', difficulty: 'medium' },
      { id: 4, studentName: 'Phạm Thị D', studentId: 'SE123459', topic: 'OOP Principles', course: 'Software Engineering', score: 5, maxScore: 10, percentage: 50, questionsCount: 10, timestamp: '2024-10-21T16:20:00', difficulty: 'hard' },
      { id: 5, studentName: 'Hoàng Văn E', studentId: 'SE123460', topic: 'Normalization', course: 'Database Systems', score: 9, maxScore: 10, percentage: 90, questionsCount: 10, timestamp: '2024-10-21T15:00:00', difficulty: 'easy' }
    ],
    totalAttempts: 168,
    averageScore: 71.5
  };

  useEffect(() => {
    loadGapData();
  }, [filters]);

  const [flaggedMap, setFlaggedMap] = useState<Record<string, { reason: string; status: string }>>({});
  const refreshFlags = async () => {
    const res = await getFlaggedQuizAttempts();
    if (res.success) {
      const map: Record<string, { reason: string; status: string }> = {};
      res.data.forEach((f: any) => { map[f.id] = { reason: f.reason, status: f.status }; });
      setFlaggedMap(map);
    }
  };
  useEffect(() => { refreshFlags(); }, [gapData]);

  const loadGapData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await getKnowledgeGapAnalytics({ dateRange: parseInt(dateRange), scoreFilter });
      setTimeout(() => {
        setGapData(mockData);
        setLoading(false);
      }, 500);
    } catch (error) {
      showNotification('Error loading analytics', 'error');
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'; // green
    if (percentage >= 60) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getScoreBadgeClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Filter handlers
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
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

  const filterQuizzes = (quizzes: QuizAttempt[]) => {
    let filtered = [...quizzes];

    // Filter by score
    if (filters.scoreFilter !== 'all') {
      if (filters.scoreFilter === 'low') filtered = filtered.filter(q => q.percentage < 60);
      if (filters.scoreFilter === 'medium') filtered = filtered.filter(q => q.percentage >= 60 && q.percentage < 80);
      if (filters.scoreFilter === 'high') filtered = filtered.filter(q => q.percentage >= 80);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.studentName.toLowerCase().includes(searchLower) ||
        q.topic.toLowerCase().includes(searchLower) ||
        q.course.toLowerCase().includes(searchLower)
      );
    }

    // Filter by course
    if (filters.course) {
      filtered = filtered.filter(q => q.course === filters.course);
    }

    // Filter by time period
    if (filters.timePeriod !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(q => {
        const quizDate = new Date(q.timestamp);
        
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
            // Assuming semester is 4 months
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

    // Filter by custom date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(q => new Date(q.timestamp) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(q => new Date(q.timestamp) <= toDate);
    }

    return filtered;
  };

  if (!gapData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredQuizzes = filterQuizzes(gapData.recentQuizzes);
  
  // Calculate filtered statistics
  const filteredTotalAttempts = filteredQuizzes.length;
  const filteredAverageScore = filteredQuizzes.length > 0 
    ? filteredQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / filteredQuizzes.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">📊 Knowledge Gap Analysis</h1>
          <p className="text-slate-600">Track quiz scores by topic from Learn Studio</p>
        </div>

        {/* Filter Component */}
        <QuestionAnalyticsFilter
          filters={filters}
          courses={availableCourses}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Quiz Attempts</p>
                <p className="text-4xl font-bold">{filteredTotalAttempts}</p>
                {filteredTotalAttempts !== gapData.totalAttempts && (
                  <p className="text-blue-200 text-xs mt-1">
                    (Overall: {gapData.totalAttempts})
                  </p>
                )}
              </div>
              <div className="text-6xl opacity-20">📝</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Average Score</p>
                <p className="text-4xl font-bold">{filteredAverageScore.toFixed(1)}%</p>
                {filteredAverageScore.toFixed(1) !== gapData.averageScore.toFixed(1) && (
                  <p className="text-purple-200 text-xs mt-1">
                    (Overall: {gapData.averageScore.toFixed(1)}%)
                  </p>
                )}
              </div>
              <div className="text-6xl opacity-20">📈</div>
            </div>
          </div>
        </div>

        {/* Top Topics Dashboard */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">🎯 Most Attempted Quiz Topics</h2>
            <div className="text-sm text-slate-600">Sorted by number of attempts</div>
          </div>

          <div className="space-y-4">
            {gapData.topTopics.map((topic, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{topic.topic}</h3>
                    {topic.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {topic.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-sm text-slate-600">{topic.course}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800">{topic.attemptCount}</div>
                  <div className="text-xs text-slate-500">attempts</div>
                </div>

                <div className="text-right">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(topic.avgScore) }}
                  >
                    {topic.avgScore}%
                  </div>
                  <div className="text-xs text-slate-500">avg score</div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-700">{topic.studentCount}</div>
                  <div className="text-xs text-slate-500">students</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quizzes List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">📋 Recently Attempted Quizzes</h2>
            <button onClick={refreshFlags} className="text-sm px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300">Refresh Flags</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Topic</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Difficulty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800">{quiz.studentName}</div>
                        <div className="text-sm text-slate-500">{quiz.studentId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 flex items-center gap-2">
                        {quiz.topic}
                        {flaggedMap[quiz.id] && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs" title={flaggedMap[quiz.id].reason || 'Flagged'}>
                            🚩 Flagged
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{quiz.course}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-lg" style={{ color: getScoreColor(quiz.percentage) }}>
                          {quiz.score}/{quiz.maxScore}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getScoreBadgeClass(quiz.percentage)}`}>
                          {quiz.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        {new Date(quiz.timestamp).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        })}
                        <div className="text-xs text-slate-400">
                          {new Date(quiz.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {quiz.difficulty === 'easy' ? 'Easy' : quiz.difficulty === 'medium' ? 'Medium' : 'Hard'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/faculty/analytics/quiz/${quiz.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuizzes.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">No quizzes match the filters</p>
            </div>
          )}
        </div>

        {/* Quiz Detail Modal removed in favor of dedicated detail page */}
      </div>
    </div>
  );
};

export default KnowledgeGapAnalysis;
