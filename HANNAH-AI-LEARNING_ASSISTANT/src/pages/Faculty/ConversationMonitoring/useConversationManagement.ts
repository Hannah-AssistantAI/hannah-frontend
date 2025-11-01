import { useState, useEffect } from 'react';
import { getFlaggedConversations, updateConversationStatus, getCourses } from '../../../service/mockApi';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';

interface Message {
  id: string;
  author: { name: string; role: string };
  content: string;
  timestamp: string;
  sourceLabel: string;
  aiConfidence?: number;
}

interface Conversation {
  id: string;
  conversationId: string;
  student: {
    id: string;
    name: string;
    avatar: string;
  };
  course: string;
  excerpt: string;
  flagReason: string;
  aiConfidence: number;
  status: string;
  priority: string;
  flaggedAt: string;
  assignedTo: string | null;
  messages: Message[];
  metadata: {
    roadmapNode: string;
    aiModel: string;
    sources: string[];
  };
  auditTrail: Array<{
    action: string;
    user: string;
    timestamp: string;
    details: string;
  }>;
}

// Transform conversation for component compatibility
export interface TransformedConversation {
  id: number;
  studentName: string;
  studentId: string;
  course: string;
  timestamp: string;
  messageCount: number;
  status: 'pending' | 'reviewed' | 'resolved';
  flags: string[];
  preview: string;
  messages: Array<{
    role: 'student' | 'ai';
    text: string;
    time: string;
  }>;
  handledBy?: string;
  facultyId?: string;
}

interface Filters {
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  course: string;
  sortBy: string;
}

export const useConversationManagement = () => {
  const { setLoading, showNotification } = useApp();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<TransformedConversation[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<TransformedConversation | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    course: '',
    sortBy: 'desc'
  });

  useEffect(() => {
    loadConversations();
    loadCourses();
  }, []);

  useEffect(() => {
    loadConversations();
  }, [filters, user]);

  // Transform API data to component format
  const transformConversation = (conv: Conversation): TransformedConversation => {
    const statusMap: { [key: string]: 'pending' | 'reviewed' | 'resolved' } = {
      'Mới': 'pending',
      'Đang xử lý': 'reviewed',
      'Đã giải quyết': 'resolved'
    };

    return {
      id: parseInt(conv.id.replace('F-', '')),
      studentName: conv.student.name,
      studentId: conv.student.id,
      course: conv.course,
      timestamp: conv.flaggedAt,
      messageCount: conv.messages.length,
      status: statusMap[conv.status] || 'pending',
      flags: [conv.flagReason],
      preview: conv.excerpt,
      messages: conv.messages.map(msg => ({
        role: msg.author.role === 'student' ? 'student' : 'ai',
        text: msg.content,
        time: new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      })),
      handledBy: conv.assignedTo || undefined
    };
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await getFlaggedConversations({
        ...filters,
        facultyId: user?.id,
        facultyName: user?.name
      });
      let transformed = response.data.map(transformConversation);
      
      // Sort by timestamp
      transformed.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return filters.sortBy === 'desc' ? timeB - timeA : timeA - timeB;
      });
      
      setConversations(transformed);
    } catch (error) {
      showNotification('Lỗi khi tải danh sách cuộc hội thoại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleViewConversation = (conversation: TransformedConversation) => {
    setSelectedConversation(conversation);
  };

  const handleCloseDetail = () => {
    setSelectedConversation(null);
  };

  const handleStatusChange = async (conversationId: number, newStatus: string) => {
    try {
      setLoading(true);
      
      const statusMap: { [key: string]: string } = {
        'reviewed': 'Đang xử lý',
        'resolved': 'Đã giải quyết'
      };
      
      await updateConversationStatus(
        `F-${conversationId}`, 
        statusMap[newStatus],
        user?.name
      );
      
      showNotification(
        `Đã cập nhật trạng thái thành "${newStatus === 'reviewed' ? 'Đã xem xét' : 'Đã giải quyết'}"`, 
        'success'
      );
      loadConversations();
    } catch (error) {
      showNotification('Lỗi khi cập nhật trạng thái', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      dateFrom: '',
      dateTo: '',
      course: '',
      sortBy: 'desc'
    });
  };

  // Calculate statistics
  const totalCount = conversations.length;
  const pendingCount = conversations.filter(c => c.status === 'pending').length;

  return {
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
  };
};
