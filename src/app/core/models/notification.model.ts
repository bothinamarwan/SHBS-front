export enum NotificationType {
  General = 'General',
  Booking = 'Booking',
  Payment = 'Payment',
  System = 'System',
  Admin = 'Admin',
  Complaint = 'Complaint',
  Review = 'Review'
}

export interface Notification {
  notificationId: string;
  userId: string;
  message: string;
  type: string;
  isSeen: boolean;
  createdAt: string;
}

export interface UpdateNotificationRequest {
  isSeen: boolean;
}
