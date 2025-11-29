// Flagging Types - Matching backend DTOs

export type FlagType = 'message' | 'quiz' | 'flashcard' | 'report' | 'mindmap';
export type FlagStatus = 'Pending' | 'Assigned' | 'Resolved';
export type FlagPriority = 'Low' | 'Medium' | 'High';

export interface FlaggedItem {
  id: number;
  type: FlagType;
  contentId?: number;
  conversationId?: number;
  conversationOwnerId?: number;
  messageId?: number;
  reason: string;
  status: FlagStatus;
  priority?: FlagPriority;
  flaggedByName: string;
  flaggedAt: string; // ISO date string
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

export interface AssignFacultyRequest {
  facultyId: number;
}

export interface FlagNotification {
  id: number;
  flagId: number;
  message: string;
  documentTitle?: string;
  resolvedByName?: string;
  resolvedAt: string;
  isRead: boolean;
}

// Request DTOs
export interface FlagContentRequest {
  flagType: FlagType;
  contentId: number;
  reason: string;
  priority?: FlagPriority;
  metadata?: Record<string, any>;
}

export interface FlagMessageRequest {
  conversationId: number;
  reason: string;
  priority?: FlagPriority;
}
