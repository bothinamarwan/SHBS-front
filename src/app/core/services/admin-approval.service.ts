import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PendingEscrowReleasesResponse,
  ReleaseEscrowRequest,
  RefundEscrowRequest
} from '../models/escrow.model';

@Injectable({
  providedIn: 'root'
})
export class AdminApprovalService {
  private baseUrl = '/api/AdminApproval';

  constructor(private http: HttpClient) {}

  getPendingEscrowReleases(): Observable<PendingEscrowReleasesResponse> {
    return this.http.get<PendingEscrowReleasesResponse>(`${this.baseUrl}/pending-escrow-releases`);
  }

  releaseEscrow(request: ReleaseEscrowRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/release-escrow`, request);
  }

  refundEscrow(request: RefundEscrowRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/refund-escrow`, request);
  }
}
