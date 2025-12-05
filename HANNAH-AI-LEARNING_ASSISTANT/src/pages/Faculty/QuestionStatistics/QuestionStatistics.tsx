import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';
import { mockAnalyticsData } from '../../../data/mockData';
import './QuestionStatistics.css';

const QuestionStatistics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState(mockAnalyticsData);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');

  useEffect(() => {
    // In a real app, fetch analytics data based on filters
    setAnalyticsData(mockAnalyticsData);
  }, [selectedCourse, selectedPeriod]);

  return (
    <div className="question-statistics-container">
      <div className="statistics-header">
        <div className="header-content">
          <h1 className="statistics-title">Question Statistics</h1>
          <p className="statistics-subtitle">
            Analyze trends and statistics of student questions
          </p>
        </div>
        <div className="header-filters">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="filter-select"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">Semester</option>
          </select>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Subjects</option>
            {analyticsData.courseStats.map((course) => (
              <option key={course.course} value={course.course}>
                {course.course}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="statistics-overview">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e6f7ff' }}>
            <BarChart3 size={24} style={{ color: '#1890ff' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Questions</p>
            <h3 className="stat-value">{analyticsData.overview.totalQuestions}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0f5ff' }}>
            <BookOpen size={24} style={{ color: '#597ef7' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Most Popular Subject</p>
            <h3 className="stat-value-text">{analyticsData.overview.topCourse}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff1f0' }}>
            <TrendingUp size={24} style={{ color: '#ff4d4f' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Most Popular Topic</p>
            <h3 className="stat-value-text">{analyticsData.overview.topTopic}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f6ffed' }}>
            <Users size={24} style={{ color: '#52c41a' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg Questions/Day</p>
            <h3 className="stat-value">
              {Math.round(analyticsData.trendData.reduce((sum, d) => sum + d.count, 0) / analyticsData.trendData.length)}
            </h3>
          </div>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="statistics-section">
        <h2 className="section-title">Statistics by Subject</h2>
        <div className="course-stats-grid">
          {analyticsData.courseStats.map((course) => (
            <div key={course.course} className="course-stat-card">
              <div className="course-stat-header">
                <h4 className="course-name">{course.course}</h4>
                <span className="course-count">{course.count} questions</span>
              </div>
              <div className="course-stat-bar">
                <div
                  className="course-stat-fill"
                  style={{
                    width: `${(course.count / analyticsData.overview.totalQuestions) * 100}%`,
                    backgroundColor: '#1890ff'
                  }}
                ></div>
              </div>
              <p className="course-stat-percentage">
                {((course.count / analyticsData.overview.totalQuestions) * 100).toFixed(1)}% of total questions
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="statistics-section">
        <h2 className="section-title">Question Trends Over Time</h2>
        <div className="trend-chart">
          {analyticsData.trendData.map((data, index) => (
            <div key={index} className="trend-day">
              <div className="trend-bar-container">
                <div
                  className="trend-bar"
                  style={{
                    height: `${(data.count / 65) * 100}%`,
                    backgroundColor: '#1890ff'
                  }}
                  title={`${data.count} questions`}
                ></div>
              </div>
              <span className="trend-label">{new Date(data.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
              <span className="trend-count">{data.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Questions */}
      <div className="statistics-section">
        <div className="section-header">
          <h2 className="section-title">Recent Questions</h2>
          <span className="section-badge">{analyticsData.recentQuestions.length} questions</span>
        </div>
        <div className="recent-questions-list">
          {analyticsData.recentQuestions.map((question) => (
            <div key={question.id} className="question-item">
              <div className="question-header">
                <span className="question-student">{question.student}</span>
                <span className="question-time">
                  {new Date(question.timestamp).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="question-content">{question.content}</p>
              <div className="question-footer">
                <span className="question-course">{question.course}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionStatistics;
