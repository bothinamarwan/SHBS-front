export interface ChatMessage {
  id?: string;
  conversationId?: string;
  senderId?: string;
  content: string;
  timestamp?: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  bookingId?: string;
  housingUnitId?: string;
  participants?: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt?: string;
  unreadCount?: number;
}

export interface InitiateChatRequest {
  housingUnitId: string;
}

export interface SendMessageRequest {
  content: string;
}
