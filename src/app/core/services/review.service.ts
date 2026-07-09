import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Review, CreateReviewRequest, UpdateReviewRequest } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = '/api/Review';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Review[]> {
    return this.http.get<{ success: boolean; data: Review[] }>(`${this.baseUrl}`).pipe(
      map(response => response.data)
    );
  }

  getByHousingUnit(housingUnitId: string): Observable<Review[]> {
    return this.http.get<{ success: boolean; data: Review[] }>(`${this.baseUrl}/housing-unit/${housingUnitId}`).pipe(
      map(response => response.data)
    );
  }

  getById(reviewId: string): Observable<Review> {
    return this.http.get<{ success: boolean; data: Review }>(`${this.baseUrl}/${reviewId}`).pipe(
      map(response => response.data)
    );
  }

  create(request: CreateReviewRequest): Observable<Review> {
    return this.http.post<{ success: boolean; data: Review }>(`${this.baseUrl}`, request).pipe(
      map(response => response.data)
    );
  }

  update(request: UpdateReviewRequest): Observable<Review> {
    return this.http.put<{ success: boolean; data: Review }>(`${this.baseUrl}/${request.reviewId}`, request).pipe(
      map(response => response.data)
    );
  }

  delete(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reviewId}`);
  }
}
