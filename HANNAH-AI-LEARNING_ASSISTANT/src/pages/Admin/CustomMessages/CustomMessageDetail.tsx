import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { mockCustomMessages } from '../../../data/mockCustomMessages';
import ApprovalModal from './ApprovalModal';
import './CustomMessageDetail.css';

const CustomMessageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const message = mockCustomMessages.find((m) => m.id === id);

  if (!message) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Not Found</h2>
          <p className="text-gray-600 mb-4">The custom message you are looking for does not exist.</p>
          <button
            onClick={() => navigate('/admin/custom-messages')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' };
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: '✅' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: '✗' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: '' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = () => {
    setModalAction('approve');
    setIsModalOpen(true);
  };

  const handleReject = () => {
    setModalAction('reject');
    setIsModalOpen(true);
  };

  const handleModalConfirm = (reason?: string) => {
    console.log(`Action: ${modalAction}`, reason ? `Reason: ${reason}` : '');
    setIsModalOpen(false);
    setTimeout(() => {
      navigate('/admin/custom-messages');
    }, 500);
  };

  const handleBack = () => {
    navigate('/admin/custom-messages');
  };

  const statusBadge = getStatusBadgeType(message.status);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm sticky top-0 z-10">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all px-4 py-2.5 hover:bg-blue-50/80 rounded-xl group font-medium"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Custom Messages</span>
              </button>
              
              {message.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    className="px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-400 rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-105"
                  >
                    <X size={18} />
                    Reject Message
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <Check size={18} />
                    Approve Message
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Custom Message Review
                  </h1>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text} border-2 ${statusBadge.border} shadow-sm`}>
                    {statusBadge.icon} {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2 font-medium">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submitted: {formatDate(message.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1800px] mx-auto p-6">
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className={`flex-1 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ${
              isSidebarCollapsed ? 'mr-0' : ''
            }`}>
              <div className="p-8">
                {/* Student Question */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-blue-100">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Student Question
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border-2 border-blue-200/60 rounded-2xl p-7 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 backdrop-blur-sm">
                    <p className="text-gray-800 leading-relaxed text-[15px] font-medium">{message.studentQuestion}</p>
                  </div>
                </div>

                {/* Message Comparison */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 ring-4 ring-purple-100">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Response Comparison
                    </h3>
                  </div>

                  <div className="space-y-8">
                    {/* Original AI Response */}
                    <div className="group">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-500/20 ring-4 ring-slate-100 group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-bold text-sm text-gray-900">Original AI Response</span>
                            <span className="px-3 py-1 bg-gradient-to-r from-slate-500 to-slate-600 text-white text-xs font-bold rounded-full shadow-md">
                              HANNAH AI
                            </span>
                          </div>
                          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:border-gray-300">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">{message.originalMessage}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Faculty Customized Response */}
                    <div className="group">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100 group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-bold text-sm text-gray-900">Customized by Faculty</span>
                            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-md">
                              FACULTY
                            </span>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-emerald-300/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-400 backdrop-blur-sm">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px] font-medium">{message.customizedMessage}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Info */}
                {message.status !== 'pending' && (
                  <div className="mt-10">
                    <div className={`rounded-2xl p-7 border-2 shadow-xl ${
                      message.status === 'approved' 
                        ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border-emerald-300 shadow-emerald-200/50'
                        : 'bg-gradient-to-br from-red-50 via-rose-50/50 to-red-50 border-red-300 shadow-red-200/50'
                    }`}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                          message.status === 'approved'
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                            : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                        }`}>
                          {message.status === 'approved' ? (
                            <Check className="text-white" size={22} strokeWidth={3} />
                          ) : (
                            <X className="text-white" size={22} strokeWidth={3} />
                          )}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {message.status === 'approved' ? 'Approved' : 'Rejected'}
                        </h4>
                      </div>
                      <div className="space-y-3 text-sm bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[120px]">Reviewed by:</span>
                          <span className="font-bold text-gray-900">{message.reviewedBy}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[120px]">Reviewed on:</span>
                          <span className="text-gray-900 font-medium">{message.reviewedAt && formatDate(message.reviewedAt)}</span>
                        </p>
                        {message.rejectionReason && (
                          <div className="mt-5 pt-5 border-t-2 border-red-200">
                            <p className="font-bold text-red-800 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Rejection Reason:
                            </p>
                            <div className="bg-red-50/80 backdrop-blur-sm rounded-lg p-4 border border-red-200">
                              <p className="text-gray-800 leading-relaxed italic">{message.rejectionReason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Faculty & Course Info */}
            <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 transition-all duration-300 ${
              isSidebarCollapsed ? 'w-14' : 'w-96'
            } flex-shrink-0 overflow-hidden`}>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full p-4 flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all border-b border-gray-200 group"
              >
                <svg 
                  className={`w-5 h-5 text-blue-600 transition-transform duration-300 group-hover:scale-125 ${
                    isSidebarCollapsed ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                {!isSidebarCollapsed && <span className="ml-2 font-bold text-blue-900">Collapse</span>}
              </button>

              {!isSidebarCollapsed && (
                <div className="p-6 overflow-y-auto max-h-[calc(100vh-100px)] space-y-6">
                  {/* Faculty Info */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-blue-200">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      Faculty Information
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                        <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Faculty Name
                        </p>
                        <p className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors">{message.facultyName}</p>
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                        <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email Address
                        </p>
                        <p className="font-semibold text-gray-900 text-sm break-words group-hover:text-blue-700 transition-colors">{message.facultyEmail}</p>
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                        <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Conversation ID
                        </p>
                        <p className="font-mono text-sm text-gray-900 bg-white/60 px-2 py-1 rounded border border-gray-300 group-hover:border-blue-400 transition-colors">{message.conversationId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-purple-200">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      Course Information
                    </h4>
                    <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-xl p-5 border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg group">
                      <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Context
                      </p>
                      <p className="font-semibold text-gray-900 leading-relaxed group-hover:text-purple-700 transition-colors">{message.context}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ApprovalModal
        isOpen={isModalOpen}
        action={modalAction}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
};

export default CustomMessageDetail;
