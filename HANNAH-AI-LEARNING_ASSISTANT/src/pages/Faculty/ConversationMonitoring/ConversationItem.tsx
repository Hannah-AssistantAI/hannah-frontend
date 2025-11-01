import React from 'react';

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

interface ConversationItemProps {
  conversation: Conversation;
  onView: (conversation: Conversation) => void;
  onStatusChange: (id: number, status: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  onView,
  onStatusChange 
}) => {
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        label: 'Chưa xử lý'
      },
      reviewed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        label: 'Đã xem xét'
      },
      resolved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        label: 'Đã giải quyết'
      }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInHours < 48) return 'Hôm qua';
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="flex-1 min-w-0">
          {/* Header with Student Info */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {conversation.studentName.charAt(0)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                {conversation.studentName}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({conversation.studentId})
                </span>
              </h3>
              <p className="text-sm text-gray-500">{conversation.course}</p>
            </div>
          </div>

          {/* Preview */}
          <div className="ml-13 mb-3">
            <p className="text-sm text-gray-700 line-clamp-2">
              {conversation.preview}
            </p>
          </div>

          {/* Meta Info */}
          <div className="ml-13 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Status */}
            <div className="flex items-center gap-1.5">
              {getStatusBadge(conversation.status)}
            </div>

            {/* Message Count */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{conversation.messageCount} tin nhắn</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(conversation.timestamp)}</span>
            </div>

            {/* Handled By (if reviewed or resolved) */}
            {conversation.handledBy && conversation.status !== 'pending' && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Bởi: {conversation.handledBy}</span>
              </div>
            )}

            {/* Flags */}
            {conversation.flags && conversation.flags.length > 0 && (
              <div className="flex items-center gap-1.5">
                {conversation.flags.map((flag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                  >
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                    </svg>
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          <button
            onClick={() => onView(conversation)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Xem chi tiết
          </button>

          {conversation.status === 'pending' && (
            <button
              onClick={() => onStatusChange(conversation.id, 'reviewed')}
              className="inline-flex items-center px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Đã xem
            </button>
          )}

          {conversation.status === 'reviewed' && (
            <button
              onClick={() => onStatusChange(conversation.id, 'resolved')}
              className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Giải quyết
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
