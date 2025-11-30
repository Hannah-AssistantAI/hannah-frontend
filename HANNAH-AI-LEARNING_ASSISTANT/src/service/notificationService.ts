import apiClient from './apiClient';

export interface FlagNotification {
  id: number;
  flagId: number;
  message: string;
  resolvedByName: string;
  resolvedAt: string;
  isRead: boolean;
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
   * Mark notification as read (optional - API doesn't exist yet)
   */
  async markAsRead(notificationId: number): Promise<void> {
    // TODO: Implement when backend API is ready
    // await apiClient.post(`/api/flagging/notifications/${notificationId}/mark-read`);
    console.log(`Marked notification ${notificationId} as read`);
  }

  /**
   * Get flag detail with message context
   */
  async getFlagDetail(flagId: number): Promise<any> {
    // First get flag info from .NET API  
    const flagResponse = await apiClient.get(`/api/flagging/flagged`);
    const flag = flagResponse.data.find((f: any) => f.id === flagId);
    
    if (!flag) {
      throw new Error('Flag not found');
    }

    // Then get message context from Python API if it's a message flag
    if (flag.messageId) {
      try {
        const contextResponse = await apiClient.get(
          `/api/Conversations/context-for-message/${flag.messageId}`
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
  }
}

export default new NotificationService();
