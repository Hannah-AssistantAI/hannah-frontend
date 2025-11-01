import { useState } from 'react';
import ConversationHeader from './ConversationHeader';
import ConversationFilter from './ConversationFilter';
import ConversationList from './ConversationList';
import { useConversationManagement } from './useConversationManagement';
import ConversationDetailModal from './ConversationDetailModal';

const ConversationMonitoring = () => {
  const [activeTab, setActiveTab] = useState<'flagged' | 'history'>('flagged');
  
  const {
    conversations,
    courses,
    selectedConversation,
    filters,
    totalCount,
    pendingCount,
    handleViewConversation,
    handleCloseDetail,
    handleStatusChange,
    handleFilterChange,
    handleResetFilters
  } = useConversationManagement();

  // Filter conversations based on active tab
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'flagged') {
      // Show pending and reviewed conversations
      return conv.status === 'pending' || conv.status === 'reviewed';
    } else {
      // Show resolved conversations
      return conv.status === 'resolved';
    }
  });

  const flaggedCount = conversations.filter(c => c.status === 'pending' || c.status === 'reviewed').length;
  const historyCount = conversations.filter(c => c.status === 'resolved').length;

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <ConversationHeader 
            totalCount={totalCount}
            pendingCount={pendingCount}
          />

          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('flagged')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'flagged'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Hội thoại gắn cờ</span>
                  {flaggedCount > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'flagged'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {flaggedCount}
                    </span>
                  )}
                </div>
                {activeTab === 'flagged' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'history'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Lịch sử chỉnh sửa</span>
                  {historyCount > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'history'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {historyCount}
                    </span>
                  )}
                </div>
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <ConversationFilter
            courses={courses}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {/* Conversation List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'flagged' ? 'Không có hội thoại gắn cờ' : 'Chưa có lịch sử chỉnh sửa'}
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  {activeTab === 'flagged' 
                    ? 'Các hội thoại được gắn cờ bởi sinh viên sẽ hiển thị tại đây để bạn xem xét và xử lý.'
                    : 'Các hội thoại đã được xử lý sẽ hiển thị tại đây để bạn có thể xem lại lịch sử.'}
                </p>
              </div>
            ) : (
              <ConversationList
                conversations={filteredConversations}
                onView={handleViewConversation}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Conversation Detail Modal */}
      <ConversationDetailModal
        conversation={selectedConversation}
        onClose={handleCloseDetail}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};

export default ConversationMonitoring;
