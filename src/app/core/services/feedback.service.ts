import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Review } from '../models/feedback.model';
import { ReviewService } from './review.service';
import { ComplaintService } from './complaint.service';
import { CreateReviewRequest } from '../models/review.model';
import { CreateComplaintRequest, Complaint } from '../models/complaint.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private reviewService = inject(ReviewService);
  private complaintService = inject(ComplaintService);

  constructor() {}

  getReviewsByHousing(housingUnitId: string): Observable<Review[]> {
    return this.reviewService.getByHousingUnit(housingUnitId);
  }

  addReview(review: Partial<Review> & { housingUnitId: string }): Observable<Review> {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentId = user?.studentId || user?.id;

    const request: CreateReviewRequest = {
      studentId: studentId,
      housingUnitId: review.housingUnitId,
      rating: review.rating || 5,
      comment: review.comment || ''
    };

    return this.reviewService.create(request);
  }

  submitComplaint(complaint: { title: string; housingUnitId: string; description: string }): Observable<Complaint> {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentId = user?.studentId || user?.id;

    const request: CreateComplaintRequest = {
      title: complaint.title,
      studentId: studentId,
      housingUnitId: complaint.housingUnitId,
      description: complaint.description
    };

    return this.complaintService.create(request);
  }

  getComplaints(): Observable<Complaint[]> {
    return this.complaintService.getAll();
  }

  getComplaintById(complaintId: string): Observable<Complaint> {
    return this.complaintService.getById(complaintId);
  }

  getComplaintsByHousingUnit(housingUnitId: string): Observable<Complaint[]> {
    return this.complaintService.getByHousingUnit(housingUnitId);
  }
}
