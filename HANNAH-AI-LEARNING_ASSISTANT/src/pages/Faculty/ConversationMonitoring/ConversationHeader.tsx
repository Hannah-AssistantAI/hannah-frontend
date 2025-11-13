import React from 'react';

interface ConversationHeaderProps {
  totalCount: number;
  pendingCount: number;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Conversation Monitoring
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage conversations that have been flagged for review
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
