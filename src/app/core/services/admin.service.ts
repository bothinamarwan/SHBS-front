import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  AdminUserResponse, 
  ReviewVerificationRequest, 
  UpdateLandlordVerificationStatusRequest, 
  ComplaintUpdateRequest,
  AdminContractRequest,
  AdminEscrowReleaseRequest,
  AdminEscrowRefundRequest,
  AdminBookingApprovalRequest
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = '/api/Admin';
  private approvalUrl = '/api/AdminApproval'; // New base URL for approvals

  constructor(private http: HttpClient) {}

  // ─── Users ─────────────────────────────────────────────────────────────
  getUsers(params: { searchTerm?: string; role?: string; isActive?: boolean; pageNumber?: number; pageSize?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params.role) httpParams = httpParams.set('Role', params.role);
    if (params.isActive !== undefined) httpParams = httpParams.set('IsActive', params.isActive);
    if (params.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber);
    if (params.pageSize) httpParams = httpParams.set('PageSize', params.pageSize);

    return this.http.get<any>(`${this.baseUrl}/users`, { params: httpParams });
  }

  toggleUserActive(userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/toggle-active`, {});
  }

  // ─── Student Verifications ─────────────────────────────────────────────
  getPendingStudentVerifications(pageNumber = 1, pageSize = 10): Observable<any> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    return this.http.get<any>(`${this.baseUrl}/verifications/pending`, { params });
  }

  reviewStudentVerification(studentId: string, request: ReviewVerificationRequest): Observable<any> {
    // Send request directly as JSON body (not wrapped in 'request' property)
    console.log('reviewStudentVerification - URL:', `${this.baseUrl}/verifications/${studentId}/review`);
    console.log('reviewStudentVerification - Request body:', request);
    console.log('reviewStudentVerification - Request body JSON:', JSON.stringify(request));
    return this.http.post(`${this.baseUrl}/verifications/${studentId}/review`, request);
  }

  getStudentIdCardUrl(studentId: string): string {
    return `${this.baseUrl}/verifications/${studentId}/id-card`;
  }

  getStudentIdCardBlob(studentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/verifications/${studentId}/id-card`, { responseType: 'blob' });
  }

  // ─── Landlord Verifications ────────────────────────────────────────────
  getPendingLandlordVerifications(pageNumber = 1, pageSize = 10): Observable<any> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    return this.http.get<any>(`${this.baseUrl}/landlords/pending`, { params });
  }

  updateLandlordVerificationStatus(landlordId: string, request: UpdateLandlordVerificationStatusRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/landlords/${landlordId}/verification-status`, request);
  }

  getLandlordNationalIdUrl(landlordId: string): string {
    return `${this.baseUrl}/verification/${landlordId}/National-ID`;
  }

  getLandlordUnitDocUrl(landlordId: string): string {
    return `${this.baseUrl}/verification/${landlordId}/Unit-Documentation`;
  }

  getLandlordNationalIdBlob(landlordId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/verification/${landlordId}/National-ID`, { responseType: 'blob' });
  }

  getLandlordUnitDocBlob(landlordId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/verification/${landlordId}/Unit-Documentation`, { responseType: 'blob' });
  }

  // ─── Complaints ────────────────────────────────────────────────────────
  getComplaints(params: { studentId?: string; housingUnitId?: string; status?: number; createdDateFrom?: string; createdDateTo?: string; pageNumber?: number; pageSize?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params.studentId) httpParams = httpParams.set('StudentId', params.studentId);
    if (params.housingUnitId) httpParams = httpParams.set('HousingUnitId', params.housingUnitId);
    if (params.status !== undefined) httpParams = httpParams.set('Status', params.status);
    if (params.createdDateFrom) httpParams = httpParams.set('CreatedDateFrom', params.createdDateFrom);
    if (params.createdDateTo) httpParams = httpParams.set('CreatedDateTo', params.createdDateTo);
    if (params.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber);
    if (params.pageSize) httpParams = httpParams.set('PageSize', params.pageSize);

    return this.http.get<any>(`${this.baseUrl}/complaints`, { params: httpParams });
  }

  updateComplaintStatus(complaintId: string, request: ComplaintUpdateRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/complaints/${complaintId}/status`, request);
  }

  // ─── Commissions ───────────────────────────────────────────────────────
  getCommissionReport(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.baseUrl}/commissions/report`, { params });
  }

  // ─── Approvals (Contracts & Escrow) ────────────────────────────────────
  getPendingContracts(): Observable<any> {
    return this.http.get<any>(`${this.approvalUrl}/pending-contracts`);
  }

  getPendingEscrowReleases(): Observable<any> {
    return this.http.get<any>(`${this.approvalUrl}/pending-escrow-releases`);
  }

  approveContract(request: AdminContractRequest): Observable<any> {
    return this.http.post(`${this.approvalUrl}/approve-contract`, request);
  }

  rejectContract(request: AdminContractRequest): Observable<any> {
    return this.http.post(`${this.approvalUrl}/reject-contract`, request);
  }

  releaseEscrow(request: AdminEscrowReleaseRequest): Observable<any> {
    return this.http.post(`${this.approvalUrl}/release-escrow`, request);
  }

  refundEscrow(request: AdminEscrowRefundRequest): Observable<any> {
    return this.http.post(`${this.approvalUrl}/refund-escrow`, request);
  }

  // ─── Booking Approvals ─────────────────────────────────────────────────
  approveBooking(bookingId: string, request: AdminBookingApprovalRequest): Observable<any> {
    return this.http.post(`${this.approvalUrl}/approve-booking/${bookingId}`, request);
  }

  rejectBooking(bookingId: string, request: AdminBookingApprovalRequest): Observable<any> {
    return this.http.post(`${this.approvalUrl}/reject-booking/${bookingId}`, request);
  }
}
