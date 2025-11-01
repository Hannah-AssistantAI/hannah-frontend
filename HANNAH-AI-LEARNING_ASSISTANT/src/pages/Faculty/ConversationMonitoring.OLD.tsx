import React, { useState, useEffect } from 'react';
import { MessageSquare, Flag, CheckCircle, Search, X, Eye, User, Bot, Clock, TrendingUp } from 'lucide-react';
import { useFacultyContext } from '../../contexts/FacultyContext';


export default function ConversationMonitoring() {
  const { setFlaggedConversationsCount } = useFacultyContext();
  const [conversations, setConversations] = useState([
    {
      id: 1,
      studentName: 'Nguyễn Văn A',
      studentId: 'SE173001',
      course: 'Software Engineering',
      timestamp: '2024-10-19 14:30',
      messageCount: 12,
      status: 'normal',
      flags: [],
      preview: 'How do I implement inheritance in Java?',
      messages: [
        { role: 'student', text: 'How do I implement inheritance in Java?', time: '14:30' },
        { role: 'ai', text: 'Inheritance in Java is implemented using the extends keyword. Here\'s a basic example...', time: '14:30' },
        { role: 'student', text: 'Can you show me an example with method overriding?', time: '14:32' },
        { role: 'ai', text: 'Sure! Here\'s an example with method overriding...', time: '14:32' }
      ]
    },
    {
      id: 2,
      studentName: 'Trần Thị B',
      studentId: 'SE173002',
      course: 'Database Systems',
      timestamp: '2024-10-19 13:45',
      messageCount: 8,
      status: 'flagged',
      flags: ['accuracy_issue'],
      preview: 'What is the difference between SQL and NoSQL?',
      messages: [
        { role: 'student', text: 'What is the difference between SQL and NoSQL?', time: '13:45' },
        { role: 'ai', text: 'SQL databases are relational...', time: '13:45' },
        { role: 'student', text: 'Which one should I use for my project?', time: '13:47' },
        { role: 'ai', text: 'It depends on your specific requirements...', time: '13:47' }
      ]
    },
    {
      id: 3,
      studentName: 'Lê Văn C',
      studentId: 'SE173003',
      course: 'Software Engineering',
      timestamp: '2024-10-19 12:20',
      messageCount: 15,
      status: 'flagged',
      flags: ['needs_review'],
      preview: 'Can you help me with design patterns?',
      messages: [
        { role: 'student', text: 'Can you help me with design patterns?', time: '12:20' },
        { role: 'ai', text: 'Of course! Which design pattern are you interested in?', time: '12:20' },
        { role: 'student', text: 'Singleton pattern', time: '12:22' },
        { role: 'ai', text: 'The Singleton pattern ensures a class has only one instance...', time: '12:22' }
      ]
    },
    {
      id: 4,
      studentName: 'Phạm Thị D',
      studentId: 'SE173004',
      course: 'Web Development',
      timestamp: '2024-10-19 11:15',
      messageCount: 20,
      status: 'normal',
      flags: [],
      preview: 'How do I center a div in CSS?',
      messages: [
        { role: 'student', text: 'How do I center a div in CSS?', time: '11:15' },
        { role: 'ai', text: 'There are several ways to center a div...', time: '11:15' }
      ]
    },
    {
      id: 5,
      studentName: 'Hoàng Văn E',
      studentId: 'SE173005',
      course: 'Software Engineering',
      timestamp: '2024-10-19 10:30',
      messageCount: 6,
      status: 'flagged',
      flags: ['accuracy_issue', 'needs_review'],
      preview: 'Explain SOLID principles',
      messages: [
        { role: 'student', text: 'Explain SOLID principles', time: '10:30' },
        { role: 'ai', text: 'SOLID is an acronym for five design principles...', time: '10:30' }
      ]
    }
  ]);


  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);


  const flagOptions = [
    { value: 'accuracy_issue', label: 'Vấn đề độ chính xác', color: 'red' },
    { value: 'needs_review', label: 'Cần xem xét', color: 'yellow' },
    { value: 'inappropriate', label: 'Không phù hợp', color: 'orange' },
    { value: 'off_topic', label: 'Ngoài chủ đề', color: 'blue' }
  ];


  const handleFlagConversation = (conversationId: number) => {
    setConversations(conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          status: selectedFlags.length > 0 ? 'flagged' : 'normal',
          flags: selectedFlags
        };
      }
      return conv;
    }));
    setShowFlagDialog(false);
    setSelectedFlags([]);
  };


  const toggleFlag = (flagValue: string) => {
    if (selectedFlags.includes(flagValue)) {
      setSelectedFlags(selectedFlags.filter(f => f !== flagValue));
    } else {
      setSelectedFlags([...selectedFlags, flagValue]);
    }
  };


  const filteredConversations = conversations.filter(conv => {
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    const matchesSearch = conv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });


  const stats = {
    total: conversations.length,
    flagged: conversations.filter(c => c.status === 'flagged').length,
    normal: conversations.filter(c => c.status === 'normal').length,
    avgMessages: Math.round(conversations.reduce((sum, c) => sum + c.messageCount, 0) / conversations.length)
  };

  // Update flagged conversations count in context
  useEffect(() => {
    setFlaggedConversationsCount(stats.flagged);
  }, [stats.flagged, setFlaggedConversationsCount]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Giám sát hội thoại</h1>
          <p className="text-slate-600">Theo dõi và kiểm tra chất lượng tương tác AI với sinh viên</p>
        </div>


        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-slate-800">{stats.total}</span>
            </div>
            <p className="text-slate-600 font-medium">Tổng hội thoại</p>
          </div>


          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Flag className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-slate-800">{stats.flagged}</span>
            </div>
            <p className="text-slate-600 font-medium">Cần xem xét</p>
          </div>


          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-slate-800">{stats.normal}</span>
            </div>
            <p className="text-slate-600 font-medium">Bình thường</p>
          </div>


          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-slate-800">{stats.avgMessages}</span>
            </div>
            <p className="text-slate-600 font-medium">TB tin nhắn</p>
          </div>
        </div>


        <div className="grid grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="col-span-1 bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>


              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${filterStatus === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterStatus('flagged')}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${filterStatus === 'flagged'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Được đánh dấu
                </button>
                <button
                  onClick={() => setFilterStatus('normal')}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${filterStatus === 'normal'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Bình thường
                </button>
              </div>
            </div>


            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 rounded-lg cursor-pointer transition ${selectedConversation?.id === conv.id
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{conv.studentName}</p>
                      <p className="text-sm text-slate-500">{conv.studentId}</p>
                    </div>
                    {conv.status === 'flagged' && (
                      <Flag className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{conv.course}</p>
                  <p className="text-sm text-slate-700 line-clamp-2 mb-2">{conv.preview}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {conv.timestamp}
                    </span>
                    <span>{conv.messageCount} tin nhắn</span>
                  </div>
                  {conv.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {conv.flags.map(flag => {
                        const flagOption = flagOptions.find(opt => opt.value === flag);
                        if (!flagOption) return null;
                        return (
                          <span
                            key={flag}
                            className={`text-xs px-2 py-1 rounded-full ${flagOption.color === 'red' ? 'bg-red-100 text-red-700' :
                                flagOption.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                  flagOption.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                              }`}
                          >
                            {flagOption.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>


          {/* Conversation Detail */}
          <div className="col-span-2 bg-white rounded-xl shadow-lg p-6">
            {selectedConversation ? (
              <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-200">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedConversation.studentName}</h2>
                    <p className="text-slate-600">{selectedConversation.studentId} • {selectedConversation.course}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowFlagDialog(true);
                      setSelectedFlags(selectedConversation.flags);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${selectedConversation.status === 'flagged'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    <Flag className="w-5 h-5" />
                    {selectedConversation.status === 'flagged' ? 'Đã đánh dấu' : 'Đánh dấu'}
                  </button>
                </div>


                {/* Messages */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
                  {selectedConversation.messages.map((msg: { role: string; text: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; time: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, idx: React.Key | null | undefined) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'student' ? '' : 'flex-row-reverse'}`}>
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === 'student' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                        {msg.role === 'student' ? (
                          <User className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Bot className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[80%] ${msg.role === 'student' ? '' : 'flex flex-col items-end'}`}>
                        <div className={`px-4 py-3 rounded-lg ${msg.role === 'student'
                            ? 'bg-blue-50 text-slate-800'
                            : 'bg-purple-50 text-slate-800'
                          }`}>
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-xs text-slate-500 mt-1">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>


                {/* Conversation Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Thông tin hội thoại</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Thời gian:</span>
                      <p className="font-medium text-slate-800">{selectedConversation.timestamp}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Số tin nhắn:</span>
                      <p className="font-medium text-slate-800">{selectedConversation.messageCount}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Trạng thái:</span>
                      <p className={`font-medium ${selectedConversation.status === 'flagged' ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {selectedConversation.status === 'flagged' ? 'Cần xem xét' : 'Bình thường'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Môn học:</span>
                      <p className="font-medium text-slate-800">{selectedConversation.course}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Eye className="w-16 h-16 mb-4" />
                <p className="text-lg">Chọn một hội thoại để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>


        {/* Flag Dialog */}
        {showFlagDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Đánh dấu Hội thoại</h3>
                <button
                  onClick={() => {
                    setShowFlagDialog(false);
                    setSelectedFlags([]);
                  }}
                  className="p-1 hover:bg-slate-100 rounded transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>


              <p className="text-slate-600 mb-4">Chọn lý do flag hội thoại này:</p>


              <div className="space-y-2 mb-6">
                {flagOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleFlag(option.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition ${selectedFlags.includes(option.value)
                        ? `border-${option.color}-500 bg-${option.color}-50`
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedFlags.includes(option.value)
                        ? `border-${option.color}-600 bg-${option.color}-600`
                        : 'border-slate-300'
                      }`}>
                      {selectedFlags.includes(option.value) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="font-medium text-slate-800">{option.label}</span>
                  </button>
                ))}
              </div>


              <div className="flex gap-3">
                <button
                  onClick={() => handleFlagConversation(selectedConversation.id)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  {selectedFlags.length > 0 ? 'Đánh dấu Hội thoại' : 'Bỏ đánh dấu'}
                </button>
                <button
                  onClick={() => {
                    setShowFlagDialog(false);
                    setSelectedFlags([]);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}