export interface Booking {
  id: string;
  studentId: string;
  housingId: string;
  housingTitle: string;
  roomId: string;
  roomName: string;
  moveInDate: string;
  duration: number; // in months
  totalPrice: number;
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled';
  bookingDate: string;
  createdAt: string;
}

export interface RentalContract {
  contractId: string;
  bookingId: string;
  terms: string;
  signedDate?: string;
  status: 'draft' | 'signed' | 'expired';
}
