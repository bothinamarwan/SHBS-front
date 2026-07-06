export enum NotificationType {
  General = 0,
  Booking = 1,
  Payment = 2,
  System = 3,
  Admin = 4,
  Chat = 5
}

export interface Notification {
  notificationId: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
