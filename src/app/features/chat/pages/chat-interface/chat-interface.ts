import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../../core/services/chat.service';
import { Conversation, ChatMessage } from '../../../../core/models/chat.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { Notification, NotificationType } from '../../../../core/models/notification.model';
import { StudentService } from '../../../../core/services/student.service';
import { LandlordService } from '../../../../core/services/landlord.service';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-interface.html'
})
export class ChatInterface implements OnInit {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);
  private landlordService = inject(LandlordService);

  newMessage = '';
  selectedConversation = signal<Conversation | null>(null);
  conversations = signal<Conversation[]>([]);
  messages = signal<ChatMessage[]>([]);
  isLoadingConversations = signal(true);
  isLoadingMessages = signal(false);
  isSending = signal(false);

  ngOnInit() {
    // Check if we navigated here with a specific conversation ID
    this.route.queryParams.subscribe(params => {
      const convId = params['conversationId'];
      if (convId) {
        this.loadSingleConversation(convId);
      } else {
        this.loadConversations();
      }
    });
  }

  loadSingleConversation(conversationId: string) {
    this.isLoadingConversations.set(true);
    this.chatService.getConversationById(conversationId).subscribe({
      next: (conv) => {
        // Enrich conversation with participant names
        this.enrichConversationWithNames(conv).then(enrichedConv => {
          this.conversations.set([enrichedConv]);
          this.selectConversation(enrichedConv);
          this.isLoadingConversations.set(false);
        });
      },
      error: (err) => {
        console.error('Failed to load conversation', err);
        this.isLoadingConversations.set(false);
      }
    });
  }

  loadConversations() {
    this.isLoadingConversations.set(true);
    this.chatService.getMyConversations().subscribe({
      next: async (convs) => {
        // Enrich all conversations with participant names
        const enrichedConversations = await Promise.all(
          convs.map(conv => this.enrichConversationWithNames(conv))
        );
        this.conversations.set(enrichedConversations);
        this.isLoadingConversations.set(false);
      },
      error: (err) => {
        console.error('Failed to load conversations', err);
        // If there's an error (e.g. endpoint doesn't exist), we just have an empty list
        this.isLoadingConversations.set(false);
      }
    });
  }

  private async enrichConversationWithNames(conv: Conversation): Promise<Conversation> {
    try {
      // Fetch student name
      if (conv.studentUserId && !conv.studentName) {
        try {
          const student = await this.studentService.getStudentByUserId(conv.studentUserId).toPromise();
          if (student) {
            conv.studentName = student.fullName;
          }
        } catch (e) {
          console.error('Failed to fetch student name for userId:', conv.studentUserId, e);
        }
      }

      // Fetch landlord name
      if (conv.landLordUserId && !conv.landlordName) {
        try {
          console.log('Fetching landlord for userId:', conv.landLordUserId);
          const landlord = await this.landlordService.getByUserId(conv.landLordUserId).toPromise();
          console.log('Landlord response:', landlord);
          if (landlord) {
            conv.landlordName = landlord.fullName;
          }
        } catch (e) {
          console.error('Failed to fetch landlord name for userId:', conv.landLordUserId, e);
        }
      }
    } catch (err) {
      console.error('Error enriching conversation with names', err);
    }
    return conv;
  }

  selectConversation(conversation: any) {
    this.selectedConversation.set(conversation);
    this.isLoadingMessages.set(true);
    
    const convId = this.getConversationId(conversation);
    if (!convId) {
      this.messages.set([]);
      this.isLoadingMessages.set(false);
      return;
    }
    
    // Mark conversation as read in the background
    // this.chatService.markAsRead(convId).subscribe({
    //   error: (err) => console.error('Failed to mark conversation as read', err)
    // });

    this.chatService.getMessages(convId).subscribe({
      next: (msgs) => {
        this.messages.set(Array.isArray(msgs) ? msgs : []);
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

    const convId = this.getConversationId(conv);
    if (!convId) {
       console.error('Cannot send message, conversation ID is missing');
       return;
    }

    const content = this.newMessage.trim();
    this.newMessage = '';
    this.isSending.set(true);

    this.chatService.sendMessage(convId, { content }).subscribe({
      next: (msg) => {
        this.messages.update(prev => {
          const currentMessages = Array.isArray(prev) ? prev : [];
          return [...currentMessages, msg];
        });
        this.isSending.set(false);

        // Create notification for the recipient
        this.createMessageNotification(conv, content);
      },
      error: () => this.isSending.set(false)
    });
  }

  private createMessageNotification(conv: Conversation, messageContent: string) {
    const currentUserId = this.currentUserId;
    const recipientId = currentUserId === conv.studentUserId ? conv.landLordUserId : conv.studentUserId;

    if (!recipientId) return;

    const notification: Omit<Notification, 'notificationId' | 'createdAt'> = {
      userId: recipientId,
      message: messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent,
      type: 'General',
      isRead: false
    };

    this.notificationService.create(notification).subscribe({
      error: (err) => console.error('Failed to create notification', err)
    });
  }

  get currentUserId(): string {
    return this.authService.currentUserValue?.id ?? '';
  }

  getConversationId(conv: any): string {
    if (!conv) return '';
    return conv.conversationId || conv.id || conv.chatId || conv.Id || '';
  }

  getConversationInitial(conv: any): string {
    if (!conv) return '#';
    const currentUserId = this.currentUserId;
    const otherUserId = currentUserId === conv.studentUserId ? conv.landLordUserId : conv.studentUserId;
    const otherUserName = currentUserId === conv.studentUserId ? conv.landlordName : conv.studentName;
    return otherUserName ? otherUserName.charAt(0).toUpperCase() : '#';
  }

  getConversationTitle(conv: any): string {
    if (!conv) return 'Conversation';
    const currentUserId = this.currentUserId;
    const otherUserId = currentUserId === conv.studentUserId ? conv.landLordUserId : conv.studentUserId;
    const otherUserName = currentUserId === conv.studentUserId ? conv.landlordName : conv.studentName;
    return otherUserName || 'Conversation';
  }
}
