import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../../core/services/chat.service';
import { Conversation, ChatMessage } from '../../../../core/models/chat.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-interface.html'
})
export class ChatInterface implements OnInit {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  newMessage = '';
  selectedConversation = signal<Conversation | null>(null);
  conversations = signal<Conversation[]>([]);
  messages = signal<ChatMessage[]>([]);
  isLoadingConversations = signal(true);
  isLoadingMessages = signal(false);
  isSending = signal(false);

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.isLoadingConversations.set(true);
    // Conversations are initiated via bookingId; load will happen when user selects a booking
    // For now we just reset loading state
    this.isLoadingConversations.set(false);
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation.set(conversation);
    this.isLoadingMessages.set(true);
    
    // Mark conversation as read in the background
    this.chatService.markAsRead(conversation.id).subscribe({
      error: (err) => console.error('Failed to mark conversation as read', err)
    });

    this.chatService.getMessages(conversation.id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.isLoadingMessages.set(false);
      },
      error: () => {
        this.messages.set([]);
        this.isLoadingMessages.set(false);
      }
    });
  }

  sendMessage() {
    const conv = this.selectedConversation();
    if (!this.newMessage.trim() || !conv) return;

    const content = this.newMessage.trim();
    this.newMessage = '';
    this.isSending.set(true);

    this.chatService.sendMessage(conv.id, { content }).subscribe({
      next: (msg) => {
        this.messages.update(prev => [...prev, msg]);
        this.isSending.set(false);
      },
      error: () => this.isSending.set(false)
    });
  }

  get currentUserId(): string {
    return this.authService.currentUserValue?.id ?? '';
  }
}
