export interface ChatMessage {
  id?: string;
  conversationId?: string;
  senderId?: string;
  content: string;
  timestamp?: string;
  isRead?: boolean;
}

export interface Conversation {
  conversationId: string;
  bookingId?: string | null;
  housingUnitId: string;
  studentUserId: string;
  landLordUserId: string;
  createdAt: string;
  // Optional fields for display
  participants?: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  // Participant names (if provided by backend)
  studentName?: string;
  landlordName?: string;
}

export interface InitiateChatRequest {
  housingUnitId: string;
}

export interface SendMessageRequest {
  content: string;
}
