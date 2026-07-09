export interface Review {
  reviewId: string;
  studentId: string;
  housingUnitId: string;
  rating: number;
  comment: string;
  reviewDate?: string;
  createdAt?: string;
  updatedAt?: string;
  studentName?: string;
}

export interface Complaint {
  id: string;
  studentId: string;
  landlordId?: string;
  housingId?: string;
  description: string;
  status: 'pending' | 'received' | 'investigating' | 'resolved' | 'rejected';
  createdDate: string;
}
