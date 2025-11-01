import React, { useState } from 'react';

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
}

interface ConversationDetailModalProps {
  conversation: Conversation | null;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}

const ConversationDetailModal: React.FC<ConversationDetailModalProps> = ({ 
  conversation, 
  onClose,
  onStatusChange 
}) => {
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  if (!conversation) return null;

  const handleEditClick = (index: number, currentText: string) => {
    setEditingMessageIndex(index);
    setEditedText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditedText('');
  };

  const handleSaveEdit = () => {
    console.log('Saving edited message:', editedText);
    setEditingMessageIndex(null);
    setEditedText('');
  };

  const handleResolve = () => {
    onStatusChange(conversation.id, 'resolved');
    onClose();
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const confirmReport = () => {
    console.log('Reporting conversation:', conversation.id);
    setShowReportModal(false);
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[9999] overflow-y-auto"
        aria-labelledby="modal-title" 
        role="dialog" 
        aria-modal="true"
      >
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Chi tiết hội thoại F-{conversation.id}</h2>
                <p className="text-sm text-white/80 mt-1">{new Date(conversation.timestamp).toLocaleString('vi-VN')}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Conversation */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Luồng hội thoại</h3>
                <div className="space-y-4">
                  {conversation.messages.map((message, index) => (
                    <div key={index}>
                      {message.role === 'student' ? (
                        <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-orange-700">Sinh viên</span>
                            <span className="text-xs font-semibold text-gray-900">{conversation.studentName}</span>
                          </div>
                          <p className="text-sm text-gray-800">{message.text}</p>
                          <p className="text-xs text-gray-500 mt-2">{message.time}</p>
                        </div>
                      ) : (
                        <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-700">AI tạo</span>
                              <span className="text-xs font-semibold text-gray-900">Hannah AI</span>
                            </div>
                            {editingMessageIndex !== index && (
                              <button
                                onClick={() => handleEditClick(index, message.text)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Chỉnh sửa
                              </button>
                            )}
                          </div>
                          {editingMessageIndex === index ? (
                            <div>
                              <textarea
                                className="w-full p-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-800">{message.text}</p>
                              <p className="text-xs text-gray-500 mt-2">{message.time}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Student Info & Actions */}
              <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
                {/* Student Info */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin sinh viên</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {conversation.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{conversation.studentName}</p>
                      <p className="text-sm text-gray-500">ID: {conversation.studentId}</p>
                    </div>
                  </div>
                </div>

                {/* Ly do gan co */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Lý do gắn cờ</h3>
                  <p className="text-sm text-gray-600">{conversation.flags[0] || 'Thông tin không chính xác'}</p>
                </div>

                {/* Related Documents */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Tệp đính kèm</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">Design Patterns - Gang of Four</p>
                        <p className="text-xs text-gray-500">Design Patterns - Gang of Four</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">Clean Architecture - Robert Martin</p>
                        <p className="text-xs text-gray-500">Clean Architecture - Robert Martin</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Thao tác</h3>
                  {(conversation.status === 'pending' || conversation.status === 'reviewed') && (
                    <button
                      onClick={handleResolve}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Đánh dấu đã giải quyết
                    </button>
                  )}
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Báo cáo cuộc hội thoại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Confirmation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowReportModal(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Báo cáo cuộc hội thoại cho quản trị viên?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Cuộc hội thoại này sẽ được gửi đến quản trị viên để xem xét và xử lý.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmReport}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Xác nhận báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConversationDetailModal;
