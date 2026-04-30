import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  id: string;
  sender: 'student' | 'landlord';
  text: string;
  time: string;
  isRead: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-interface.html'
})
export class ChatInterface {
  newMessage = '';
  selectedChat = signal<Chat | null>(null);

  chats: Chat[] = [
    {
      id: '1',
      name: 'Ahmed Kamal',
      avatar: 'https://ui-avatars.com/api/?name=Ahmed+K&background=4F46E5&color=fff',
      lastMessage: 'The room is available for immediate viewing.',
      time: '12:45 PM',
      unread: 2
    },
    {
      id: '2',
      name: 'Mona Refaat',
      avatar: 'https://ui-avatars.com/api/?name=Mona+R&background=E11D48&color=fff',
      lastMessage: 'Sure, I can send you more photos of the kitchen.',
      time: 'Yesterday',
      unread: 0
    }
  ];

  messages: Message[] = [
    { id: '1', sender: 'landlord', text: 'Hello! I noticed you were interested in the Premium Studio.', time: '12:30 PM', isRead: true },
    { id: '2', sender: 'student', text: 'Yes, is it still available for May?', time: '12:32 PM', isRead: true },
    { id: '3', sender: 'landlord', text: 'Yes, it is! The room is available for immediate viewing.', time: '12:45 PM', isRead: false }
  ];

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.messages.push({
      id: Date.now().toString(),
      sender: 'student',
      text: this.newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    });
    
    this.newMessage = '';
  }
}
