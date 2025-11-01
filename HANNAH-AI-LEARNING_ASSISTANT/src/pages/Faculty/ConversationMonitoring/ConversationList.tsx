import React from 'react';
import ConversationItem from './ConversationItem';

interface Message {
  role: 'student' | 'ai';
  text: string;
  time: string;
}

interface Conversation {
  id: number;
  studentName: string;
  studentId: string;
  course: string;
  timestamp: string;
  messageCount: number;
  status: 'pending' | 'reviewed' | 'resolved';
  flags: string[];
  preview: string;
  messages: Message[];
  handledBy?: string;
  facultyId?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  onView: (conversation: Conversation) => void;
  onStatusChange: (id: number, status: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  onView,
  onStatusChange 
}) => {
  if (conversations.length === 0) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Không tìm thấy cuộc hội thoại nào
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách Cuộc hội thoại
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {conversations.length} cuộc hội thoại
            </span>
          </div>
        </div>
      </div>

      {/* Conversation Items */}
      <div>
        {conversations.map(conversation => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            onView={onView}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
