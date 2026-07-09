export interface Review {
  reviewId: string;
  studentId: string;
  housingUnitId: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
  studentName?: string;
}

export interface CreateReviewRequest {
  studentId: string;
  housingUnitId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewRequest {
  reviewId: string;
  rating: number;
  comment: string;
}
