export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: 'card' | 'wallet' | 'cash';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string;
  transactionId?: string;
}

export interface Wishlist {
  id: string;
  studentId: string;
  housingId: string;
  addedDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'message';
  status: 'unread' | 'read';
  createdAt: string;
}
