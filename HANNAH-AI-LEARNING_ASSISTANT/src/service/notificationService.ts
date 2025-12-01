import apiClient from './apiClient';

export interface FlagNotification {
  id: number;
  flagId: number;
  message: string;
  resolvedByName: string;
  resolvedAt: string;
  isRead: boolean;
}

export interface FlagDetail {
  id: number;
  conversationId?: number;
  messageId?: number;
  flaggedByUserId: number;
  assignedToUserId?: number;
  status: string;
  notes?: string;
  createdAt: string;
  resolvedByUserId?: number;
  resolvedByName?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface FlagDetailWithContext extends FlagDetail {
  messageContext?: any;
}

class NotificationService {
  /**
   * Get notifications for current student - resolved flags
   */
  async getNotifications(): Promise<FlagNotification[]> {
    const response = await apiClient.get<FlagNotification[]>('/api/flagging/notifications');
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.post(`/api/flagging/notifications/${notificationId}/mark-read`);
  }

  /**
   * Get flag detail with message context
   */
  async getFlagDetail(flagId: number): Promise<FlagDetailWithContext> {
    try {
      // Use new student-accessible endpoint
      const flagResponse = await apiClient.get<FlagDetail>(`/api/flagging/${flagId}/detail`);
      const flag = flagResponse.data;

      // Then get message context from API if it's a message flag
      if (flag.messageId && flag.conversationId) {
        try {
          const contextResponse = await apiClient.get(
            `/api/Conversations/${flag.conversationId}/context-for-message/${flag.messageId}`
          );
          return {
            ...flag,
            messageContext: contextResponse.data
          };
        } catch (error) {
          console.error('Error fetching message context:', error);
          return flag;
        }
      }

      return flag;
    } catch (error) {
      console.error('Error fetching flag detail:', error);
      throw error;
    }
  }
}

export default new NotificationService();