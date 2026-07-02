import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { Review, Complaint } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private reviews = signal<Review[]>([]);
  private complaints = signal<Complaint[]>([]);

  constructor() {
    this.loadMockData();
  }

  private loadMockData() {
    this.reviews.set([]);
    this.complaints.set([]);
  }

  getReviewsByHousing(housingId: string): Observable<Review[]> {
    return of(this.reviews().filter(r => r.housingId === housingId)).pipe(delay(800));
  }

  addReview(review: Partial<Review>): Observable<Review> {
    const newReview: Review = {
      id: 'rev' + Math.floor(Math.random() * 1000),
      studentId: review.studentId || 'current-user',
      studentName: review.studentName || 'Student',
      housingId: review.housingId!,
      rating: review.rating || 5,
      comment: review.comment || '',
      reviewDate: new Date().toISOString().split('T')[0]
    };

    return of(newReview).pipe(
      delay(1500),
      tap(r => this.reviews.update(prev => [r, ...prev]))
    );
  }

  submitComplaint(complaint: Partial<Complaint>): Observable<Complaint> {
    const newComplaint: Complaint = {
      id: 'comp' + Math.floor(Math.random() * 1000),
      studentId: complaint.studentId || 'current-user',
      landlordId: complaint.landlordId,
      housingId: complaint.housingId,
      description: complaint.description || '',
      status: 'pending',
      createdDate: new Date().toISOString().split('T')[0]
    };

    return of(newComplaint).pipe(
      delay(1500),
      tap(c => this.complaints.update(prev => [c, ...prev]))
    );
  }

  getComplaints(): Observable<Complaint[]> {
    return of(this.complaints()).pipe(delay(1000));
  }
}
