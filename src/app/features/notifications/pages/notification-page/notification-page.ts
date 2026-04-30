import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-page.html'
})
export class NotificationPage {
  notifications = [
    {
      title: 'Booking Confirmed!',
      message: 'Your stay at Sunny Palace has been approved by the landlord. Please review the contract.',
      time: '2 hours ago',
      icon: 'fas fa-check-circle',
      color: 'bg-emerald-50 text-emerald-500'
    },
    {
      title: 'New Message',
      message: 'Ahmed Kamal sent you a message regarding the Premium Studio.',
      time: '5 hours ago',
      icon: 'fas fa-comment-dots',
      color: 'bg-indigo-50 text-indigo-500'
    },
    {
      title: 'Payment Reminder',
      message: 'Your booking deposit for next month is due in 3 days.',
      time: '1 day ago',
      icon: 'fas fa-wallet',
      color: 'bg-amber-50 text-amber-500'
    }
  ];
}
