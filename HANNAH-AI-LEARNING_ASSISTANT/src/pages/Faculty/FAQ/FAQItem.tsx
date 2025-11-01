import React, { useState } from 'react';

type FAQ = {
  id: string | number;
  question: string;
  answer: string;
  course: string;
  tags: string[];
  updatedBy: string;
  createdAt: string | number | Date;
  usageCount?: number;
};

type FAQItemProps = {
  faq: FAQ;
  onEdit: (faq: FAQ) => void;
  onDelete: (id: FAQ['id']) => void;
};

const FAQItem: React.FC<FAQItemProps> = ({ faq, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (date: string | number | Date): string => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="flex-1 min-w-0">
          {/* Question */}
          <div 
            className="flex items-start gap-2 cursor-pointer group mb-3"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex-shrink-0 mt-1">
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-150">
              {faq.question}
            </h3>
          </div>

          {/* Answer */}
          <div className={`ml-7 mb-3 ${expanded ? '' : ''}`}>
            <p className="text-sm text-gray-600 leading-relaxed">
              {expanded ? faq.answer : truncateText(faq.answer)}
            </p>
            
            {!expanded && faq.answer.length > 150 && (
              <button
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                }}
              >
                Xem thêm →
              </button>
            )}
          </div>

          {/* Meta Info */}
          <div className="ml-7 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Course Badge */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {faq.course}
              </span>
            </div>

            {/* Tags */}
            {faq.tags && faq.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {faq.tags.map(tag => (
                  <span 
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Usage Count */}
            {faq.usageCount !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{faq.usageCount} lượt xem</span>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="ml-7 mt-3 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{faq.updatedBy}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(faq.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={() => onEdit(faq)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Chỉnh sửa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(faq.id)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Xóa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQItem;
