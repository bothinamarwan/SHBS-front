export interface Review {
  id: string;
  studentId: string;
  studentName?: string;
  housingId: string;
  rating: number;
  comment: string;
  reviewDate: string;
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
