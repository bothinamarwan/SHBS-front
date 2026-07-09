import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, CreateReviewRequest, UpdateReviewRequest } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = '/api/Review';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}`);
  }

  getByHousingUnit(housingUnitId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/housing-unit/${housingUnitId}`);
  }

  getById(reviewId: string): Observable<Review> {
    return this.http.get<Review>(`${this.baseUrl}/${reviewId}`);
  }

  create(request: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}`, request);
  }

  update(request: UpdateReviewRequest): Observable<Review> {
    return this.http.put<Review>(`${this.baseUrl}/${request.reviewId}`, request);
  }

  delete(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reviewId}`);
  }
}
