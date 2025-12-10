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
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-500">Manage your FAQ entries</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 shadow-sm">
            {faqs.length} {faqs.length === 1 ? 'question' : 'questions'}
          </span>
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
