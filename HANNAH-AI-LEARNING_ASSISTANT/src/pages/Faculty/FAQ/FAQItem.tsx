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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete(faq.id);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
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
                  Đọc thêm →
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
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-500 mt-1">Hành động này không thể hoàn tác</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn xóa câu hỏi này?
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                  "{faq.question}"
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FAQItem;
