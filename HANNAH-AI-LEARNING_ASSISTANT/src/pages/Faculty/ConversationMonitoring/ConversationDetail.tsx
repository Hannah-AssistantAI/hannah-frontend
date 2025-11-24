import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getFlaggedConversations, updateConversationStatus } from '../../../service/mockApi';

interface Message {
  role: 'student' | 'ai';
  text: string;
  time: string;
}

interface FacultyResponse {
  text: string;
  facultyName: string;
  timestamp: string;
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

const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLoading, showNotification } = useApp();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [facultyResponses, setFacultyResponses] = useState<{ [key: number]: string }>({});
  const [submittedResponses, setSubmittedResponses] = useState<{ [key: number]: FacultyResponse }>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadConversation();
  }, [id]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await getFlaggedConversations({});
      const conv = response.data.find((c: any) => c.id === `F-${id}`);

      if (conv) {
        const transformed: Conversation = {
          id: parseInt(conv.id.replace('F-', '')),
          studentName: conv.student.name,
          studentId: conv.student.id,
          course: conv.course,
          timestamp: conv.flaggedAt,
          messageCount: conv.messages.length,
          status: conv.status === 'Mới' ? 'pending' : conv.status === 'Đang xử lý' ? 'reviewed' : 'resolved',
          flags: [conv.flagReason],
          preview: conv.excerpt,
          messages: conv.messages.map((msg: any) => ({
            role: msg.author.role === 'student' ? 'student' : 'ai',
            text: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          })),
          handledBy: conv.assignedTo || undefined
        };
        setConversation(transformed);
      } else {
        showNotification('Conversation not found', 'error');
        navigate('/faculty/conversations');
      }
    } catch (error) {
      showNotification('Failed to load conversation details', 'error');
      navigate('/faculty/conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyResponseChange = (messageIndex: number, value: string) => {
    setFacultyResponses(prev => ({
      ...prev,
      [messageIndex]: value
    }));
  };

  const handleSubmitResponse = (messageIndex: number) => {
    const response = facultyResponses[messageIndex];
    if (!response || !response.trim()) {
      showNotification('Please enter a response', 'error');
      return;
    }

    // Save the submitted response with faculty info and timestamp
    const submittedResponse: FacultyResponse = {
      text: response,
      facultyName: user?.name || 'Faculty',
      timestamp: new Date().toISOString()
    };

    setSubmittedResponses(prev => ({
      ...prev,
      [messageIndex]: submittedResponse
    }));

    // Clear the input field
    setFacultyResponses(prev => {
      const updated = { ...prev };
      delete updated[messageIndex];
      return updated;
    });

    console.log('Submitting faculty response for message', messageIndex, ':', response);
    showNotification('Faculty response updated', 'success');
    // TODO: Call API to save faculty response
  };

  const handleEditResponse = (messageIndex: number) => {
    const submitted = submittedResponses[messageIndex];
    if (submitted) {
      // Move text back to input field
      setFacultyResponses(prev => ({
        ...prev,
        [messageIndex]: submitted.text
      }));

      // Remove from submitted
      setSubmittedResponses(prev => {
        const updated = { ...prev };
        delete updated[messageIndex];
        return updated;
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!conversation) return;

    try {
      setLoading(true);
      await updateConversationStatus(`F-${conversation.id}`, newStatus);
      showNotification('Status updated successfully', 'success');
      navigate('/faculty/conversations');
    } catch (error) {
      showNotification('Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = () => {
    handleStatusChange('resolved');
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const confirmReport = () => {
    console.log('Reporting conversation:', conversation?.id);
    showNotification('Conversation reported', 'success');
    setShowReportModal(false);
    navigate('/faculty/conversations');
  };

  const handleBack = () => {
    navigate('/faculty/conversations');
  };

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 hover:bg-gray-100 rounded-lg group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to list</span>
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleReport}
                  className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 shadow-sm hover:shadow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Report issue
                </button>
                <button
                  onClick={handleResolve}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as resolved
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Conversation #{conversation.id}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      conversation.status === 'reviewed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                    {conversation.status === 'pending' ? '⏳ Pending' :
                      conversation.status === 'reviewed' ? '🔍 In review' : '✅ Resolved'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(conversation.timestamp).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1800px] mx-auto p-6">
          <div className="flex gap-6">
            {/* Main Chat Area */}
            <div className={`flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'mr-0' : ''
              }`}>
              {/* Conversation Messages */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    Conversation content
                  </h3>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                    {conversation.messageCount} messages
                  </span>
                </div>

                <div className="space-y-6">
                  {conversation.messages.map((message, index) => (
                    <div key={index} className="message-item">
                      {/* Message Display */}
                      <div className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div className={`max-w-3xl ${message.role === 'student' ? 'w-full' : 'w-full'}`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${message.role === 'student'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                : 'bg-gradient-to-br from-purple-500 to-purple-600'
                              }`}>
                              {message.role === 'student' ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-sm text-gray-900">
                                  {message.role === 'student' ? 'Student' : 'Hannah AI'}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{message.time}</span>
                              </div>

                              <div className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${message.role === 'student'
                                  ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200'
                                  : 'bg-white border-2 border-gray-200'
                                }`}>
                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Faculty Response Box - Only for AI messages */}
                      {message.role === 'ai' && (
                        <div className="flex justify-start ml-14">
                          <div className="max-w-3xl w-full">
                            {submittedResponses[index] ? (
                              // Show submitted response
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all">
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <span className="font-bold text-sm text-green-900">
                                        {submittedResponses[index].facultyName}
                                      </span>
                                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                                        FACULTY
                                      </span>
                                      <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                        {new Date(submittedResponses[index].timestamp).toLocaleString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>

                                    <div className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm">
                                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                                        {submittedResponses[index].text}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                      <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-green-700 font-semibold">
                                          Response updated
                                        </span>
                                      </div>

                                      <button
                                        onClick={() => handleEditResponse(index)}
                                        className="px-4 py-2 text-sm font-medium text-green-700 hover:text-green-800 bg-white hover:bg-green-50 border border-green-300 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // Show input box
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </div>
                                  <span className="font-bold text-sm text-green-900">Faculty response</span>
                                </div>

                                <textarea
                                  value={facultyResponses[index] || ''}
                                  onChange={(e) => handleFacultyResponseChange(index, e.target.value)}
                                  placeholder="Enter your response or adjusted answer here..."
                                  className="w-full p-4 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white text-gray-800 placeholder-gray-400 shadow-sm text-[15px]"
                                  rows={4}
                                />

                                <div className="flex justify-between items-center mt-4">
                                  <span className="text-xs text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Response will be saved to compare with AI
                                  </span>
                                  <button
                                    onClick={() => handleSubmitResponse(index)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Update response
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Student Info & Resources */}
            <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 ${isSidebarCollapsed ? 'w-14' : 'w-96'
              } flex-shrink-0 overflow-hidden`}>
              {/* Toggle Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full p-4 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all border-b border-gray-200 group"
              >
                <svg
                  className={`w-5 h-5 text-blue-600 transition-transform duration-300 group-hover:scale-110 ${isSidebarCollapsed ? 'rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {!isSidebarCollapsed && <span className="ml-2 font-bold text-blue-900">Collapse</span>}
              </button>

              {!isSidebarCollapsed && (
                <div className="p-5 overflow-y-auto max-h-[calc(100vh-100px)] space-y-6">
                  {/* Student Info Section */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-blue-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      Student information
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
                        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Student name</p>
                        <p className="font-bold text-gray-900 text-base">{conversation.studentName}</p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">{conversation.studentId}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
                        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Course</p>
                        <p className="font-bold text-gray-900">{conversation.course}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Status</p>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${conversation.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                            conversation.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                              'bg-green-50 text-green-700 border-green-300'
                          }`}>
                          {conversation.status === 'pending' ? '⏳ Pending' :
                            conversation.status === 'reviewed' ? '🔍 In review' : '✅ Resolved'}
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
                        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Handled by</p>
                        <p className="font-bold text-gray-900">{conversation.handledBy || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Flags Section */}
                  {conversation.flags.length > 0 && (
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-red-100">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                        </div>
                        Flag reasons
                      </h4>
                      <div className="space-y-2">
                        {conversation.flags.map((flag, index) => (
                          <div key={index} className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 hover:border-red-300 transition-all shadow-sm">
                            <p className="text-sm text-red-800 font-semibold">{flag}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Sources Section */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b-2 border-purple-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      References
                    </h4>
                    <div className="space-y-2">
                      {/* Mock data - Replace with actual data from API */}
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 hover:border-purple-300 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">Lecture slides - Chapter 3</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-white rounded-full h-2 overflow-hidden shadow-inner">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full" style={{ width: '95%' }}></div>
                              </div>
                              <span className="text-xs font-bold text-purple-700">95%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 hover:border-purple-300 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">Basic textbook</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-white rounded-full h-2 overflow-hidden shadow-inner">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full" style={{ width: '88%' }}></div>
                              </div>
                              <span className="text-xs font-bold text-purple-700">88%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 hover:border-purple-300 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">FAQ - Frequently asked questions</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-white rounded-full h-2 overflow-hidden shadow-inner">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full" style={{ width: '92%' }}></div>
                              </div>
                              <span className="text-xs font-bold text-purple-700">92%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 text-center mt-3">
                        <p className="text-xs text-gray-600 font-bold">📚 Total: 3 referenced documents</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowReportModal(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Report issue
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Are you sure you want to report this conversation? This action will be sent to administrators for review and handling.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={confirmReport}
                      className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-xl"
                    >
                      Confirm report
                    </button>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConversationDetail;
