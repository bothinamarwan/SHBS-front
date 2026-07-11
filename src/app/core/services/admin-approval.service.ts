import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PendingEscrowReleasesResponse,
  ReleaseEscrowRequest,
  RefundEscrowRequest
} from '../models/escrow.model';
import {
  ContractApprovalRequest,
  ContractRejectionRequest,
  PendingContract
} from '../models/contract.model';

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

  getPendingContracts(): Observable<PendingContract[]> {
    return this.http.get<PendingContract[]>(`${this.baseUrl}/pending-contracts`);
  }

  approveContract(request: ContractApprovalRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/approve-contract`, request);
  }

  rejectContract(request: ContractRejectionRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/reject-contract`, request);
  }
}
