import React, { useState } from 'react';

interface QuestionAnalyticsFilterProps {
  filters: {
    search: string;
    dateFrom: string;
    dateTo: string;
    course: string;
    timePeriod: string;
    scoreFilter: string;
    selectedMonth: string;
    subjectSearch: string;
  };
  courses: string[];
  monthOptions: { value: string; label: string }[];
  onFilterChange: (filters: Partial<{
    search: string;
    dateFrom: string;
    dateTo: string;
    course: string;
    timePeriod: string;
    scoreFilter: string;
    selectedMonth: string;
    subjectSearch: string;
  }>) => void;
  onReset: () => void;
}

const QuestionAnalyticsFilter: React.FC<QuestionAnalyticsFilterProps> = ({
  filters,
  courses,
  monthOptions,
  onFilterChange,
  onReset
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const scoreOptions = [
    { value: 'all', label: 'All', color: 'gray' },
    { value: 'low', label: 'Low (< 60%)', color: 'red' },
    { value: 'medium', label: 'Medium (60-79%)', color: 'orange' },
    { value: 'high', label: 'High (≥ 80%)', color: 'green' }
  ];

  // Helper to get current time range display value
  const getTimeRangeValue = () => {
    if (filters.selectedMonth) return filters.selectedMonth;
    return filters.timePeriod;
  };

  // Helper to get time range label for active filters
  const getTimeRangeLabel = () => {
    if (filters.selectedMonth) {
      return monthOptions.find(m => m.value === filters.selectedMonth)?.label || filters.selectedMonth;
    }
    switch (filters.timePeriod) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="p-6">
        {/* Main Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Subject Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Subject Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="e.g., PRN212, MAD101..."
                value={filters.subjectSearch}
                onChange={(e) => onFilterChange({ subjectSearch: e.target.value })}
              />
              {filters.subjectSearch && (
                <button
                  onClick={() => onFilterChange({ subjectSearch: '' })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Time Range Filter (Unified Month + Time Period) */}
          <div className="lg:w-56">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              value={getTimeRangeValue()}
              onChange={(e) => {
                const value = e.target.value;
                // Check if it's a month value (format: YYYY-MM) or a time period
                if (value.match(/^\d{4}-\d{2}$/)) {
                  onFilterChange({ selectedMonth: value, timePeriod: 'all' });
                } else {
                  onFilterChange({ selectedMonth: '', timePeriod: value });
                }
              }}
            >
              <optgroup label="Quick Filters">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </optgroup>
              <optgroup label="Specific Month">
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Score Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score Range
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              value={filters.scoreFilter}
              onChange={(e) => onFilterChange({ scoreFilter: e.target.value })}
            >
              {scoreOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filter Toggle */}
          <div className="lg:w-auto flex items-end">
            <button
              className="inline-flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {showAdvanced ? 'Hide' : 'More'}
            </button>
          </div>

          {/* Reset Button */}
          <div className="lg:w-auto flex items-end">
            <button
              className="inline-flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              onClick={onReset}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={filters.dateFrom}
                  onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={filters.dateTo}
                  onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                />
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={filters.course}
                  onChange={(e) => onFilterChange({ course: e.target.value })}
                >
                  <option value="">All courses</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(filters.scoreFilter !== 'all' || filters.search || filters.dateFrom || filters.dateTo || filters.course || filters.timePeriod !== 'all' || filters.selectedMonth || filters.subjectSearch) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>

            {filters.subjectSearch && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                Subject: "{filters.subjectSearch}"
                <button
                  onClick={() => onFilterChange({ subjectSearch: '' })}
                  className="ml-2 hover:text-teal-900"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {getTimeRangeLabel() && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                Time: {getTimeRangeLabel()}
                <button
                  onClick={() => onFilterChange({ selectedMonth: '', timePeriod: 'all' })}
                  className="ml-2 hover:text-cyan-900"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {filters.scoreFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Score: {scoreOptions.find(s => s.value === filters.scoreFilter)?.label}
                <button
                  onClick={() => onFilterChange({ scoreFilter: 'all' })}
                  className="ml-2 hover:text-blue-900"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Date: {filters.dateFrom || '...'} → {filters.dateTo || '...'}
                <button
                  onClick={() => onFilterChange({ dateFrom: '', dateTo: '' })}
                  className="ml-2 hover:text-purple-900"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {filters.course && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                Course: {filters.course}
                <button
                  onClick={() => onFilterChange({ course: '' })}
                  className="ml-2 hover:text-indigo-900"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionAnalyticsFilter;
