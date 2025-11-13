import React from 'react';
import FAQItem from './FAQItem';

interface FAQListProps {
  faqs: any[];
  onEdit: (faq: any) => void;
  onDelete: (id: string | number) => void;
}

const FAQList: React.FC<FAQListProps> = ({ faqs, onEdit, onDelete }) => {
  if (faqs.length === 0) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
          <p className="text-sm text-gray-500 mb-6">Add your first question to start managing FAQs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions List</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {faqs.length} {faqs.length === 1 ? 'question' : 'questions'}
            </span>
          </div>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="divide-y divide-gray-100">
        {faqs.map(faq => (
          <FAQItem
            key={faq.id}
            faq={faq}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQList;
