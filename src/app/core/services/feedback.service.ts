import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Review, Complaint } from '../models/feedback.model';
import { ReviewService } from './review.service';
import { CreateReviewRequest } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private reviewService = inject(ReviewService);

  constructor() {}

  getReviewsByHousing(housingUnitId: string): Observable<Review[]> {
    return this.reviewService.getByHousingUnit(housingUnitId);
  }

  addReview(review: Partial<Review> & { housingId: string }): Observable<Review> {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentId = user?.studentId || user?.id;

    const request: CreateReviewRequest = {
      studentId: studentId,
      housingUnitId: review.housingId,
      rating: review.rating || 5,
      comment: review.comment || ''
    };

    return this.reviewService.create(request);
  }

  submitComplaint(complaint: Partial<Complaint>): Observable<Complaint> {
    // TODO: Implement complaint API when available
    const newComplaint: Complaint = {
      id: 'comp' + Math.floor(Math.random() * 1000),
      studentId: complaint.studentId || 'current-user',
      landlordId: complaint.landlordId,
      housingId: complaint.housingId,
      description: complaint.description || '',
      status: 'pending',
      createdDate: new Date().toISOString().split('T')[0]
    };

    return new Observable(observer => {
      setTimeout(() => observer.next(newComplaint), 1500);
    });
  }

  getComplaints(): Observable<Complaint[]> {
    // TODO: Implement complaint API when available
    return new Observable(observer => {
      setTimeout(() => observer.next([]), 1000);
    });
  }
}
