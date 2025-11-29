import { API_ENDPOINTS, API_BASE_URL, STORAGE_KEYS } from '../config/apiConfig';
// Service for flagging operations

export interface FlaggedItem {
  id: number;
  type: string;
  contentId?: number;
  conversationId?: number;
  conversationOwnerId?: number;
  messageId?: number;
  reason: string;
  status: string;
  priority?: string;
  flaggedByName: string;
  flaggedAt: string;
  assignedToName?: string;
  metadata?: Record<string, any>;
}

export interface MessageInContext {
  messageId: string;
  role: string;
  content: string;
  timestamp: string;
  isFlagged: boolean;
}

export interface MessageContext {
  messages: MessageInContext[];
  flaggedMessageId: string;
}

export interface Resolution {
  knowledgeGapFix: string;
  studentNotification: string;
}

/**
 * Service for managing flagged messages and content
 */
class FlaggingService {
  /**
   * Get all flagged items (Admin & Faculty)
   * @param status Optional filter by status (Pending, Assigned, Resolved)
   */
  async getFlaggedItems(status?: string): Promise<FlaggedItem[]> {
    try {
      const url = status
        ? `${API_BASE_URL}${API_ENDPOINTS.FLAGGING.GET_FLAGGED}?status=${status}`
        : `${API_BASE_URL}${API_ENDPOINTS.FLAGGING.GET_FLAGGED}`;

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      console.log('[DEBUG] Token:', token?.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flagged items: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching flagged items:', error);
      throw error;
    }
  }

  /**
   * Get flagged items assigned to current faculty member
   * Faculty only
   */
  async getAssignedFlags(): Promise<FlaggedItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FLAGGING.ASSIGNED_TO_ME}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assigned flags: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assigned flags:', error);
      throw error;
    }
  }

  /**
   * Get message context for a flagged message
   * @param conversationId Conversation ID
   * @param messageId MongoDB message ID
   * @param windowSize Number of messages before/after (default 5)
   */
  async getMessageContext(
    conversationId: number,
    messageId: string,
    windowSize: number = 5
  ): Promise<MessageContext> {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CONVERSATIONS.BASE}/${conversationId}/context-for-message/${messageId}?windowSize=${windowSize}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch message context: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching message context:', error);
      throw error;
    }
  }

  /**
   * Resolve a flagged item (Faculty only)
   * @param flagId Flag ID
   * @param resolution Knowledge gap fix and student notification
   */
  async resolveFlag(flagId: number, resolution: Resolution): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FLAGGING.RESOLVE(flagId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(resolution)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to resolve flag: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error resolving flag:', error);
      throw error;
    }
  }

  /**
   * Assign a flag to a faculty member (Admin only)
   * @param flagId Flag ID
   * @param facultyId Faculty user ID
   */
  async assignToFaculty(flagId: number, facultyId: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.CONVERSATIONS.BASE}/flagged/${flagId}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ facultyId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to assign flag: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error assigning flag:', error);
      throw error;
    }
  }

  /**
   * Flag a message (Student)
   * @param messageId Message ID
   * @param conversationId Conversation ID
   * @param reason Reason for flagging
   * @param priority Priority level
   */
  async flagMessage(
    messageId: number,
    conversationId: number,
    reason: string,
    priority: string = 'Medium'
  ): Promise<{ success: boolean; flagId: number; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.FLAGGING.FLAG_MESSAGE(messageId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ conversationId, reason, priority })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to flag message: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error flagging message:', error);
      throw error;
    }
  }
  /**
   * Get flagged quizzes (Admin)
   * Fetches quizzes from the flagging endpoint filtered by entity type
   */
  async getFlaggedQuizzes(status?: string): Promise<FlaggedItem[]> {
    try {
      // Use the general flagging endpoint and filter by entity_type=quiz
      const statusParam = status ? `?status=${status}&entity_type=quiz` : '?entity_type=quiz';
      const url = `${API_BASE_URL}${API_ENDPOINTS.FLAGGING.GET_FLAGGED}${statusParam}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flagged quizzes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching flagged quizzes:', error);
      throw error;
    }
  }
}

export default new FlaggingService();
