import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation, ChatMessage, InitiateChatRequest, SendMessageRequest } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/Chat';

  initiateChat(data: InitiateChatRequest): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}/initiate`, data);
  }

  getConversationsByBooking(bookingId: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations/${bookingId}`);
  }

  getMyConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations`);
  }

  getConversationById(conversationId: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.baseUrl}/by-id/${conversationId}`);
  }

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, data: SendMessageRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/conversations/${conversationId}/messages`, data);
  }

  markAsRead(conversationId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/conversations/${conversationId}/read`, {});
  }
}
