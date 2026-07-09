import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contract, StudentSignatureRequest, LandlordSignatureRequest, AdminApprovalRequest, AdminRejectionRequest, AdminContractUploadRequest } from '../models/contract.model';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private baseUrl = '/api/contracts';

  constructor(private http: HttpClient) {}

  getById(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.baseUrl}/${id}`);
  }

  studentSign(id: string, req: StudentSignatureRequest): Observable<Contract> {
    return this.http.post<Contract>(`${this.baseUrl}/${id}/signatures/student`, req);
  }

  landlordSign(id: string, req: LandlordSignatureRequest): Observable<Contract> {
    return this.http.post<Contract>(`${this.baseUrl}/${id}/signatures/owner`, req);
  }

  adminApprove(id: string, req: string): Observable<Contract> {
    return this.http.post<Contract>(`/api/Admin/bookings/${id}/approve`, req);
  }

  adminReject(id: string, req: string): Observable<Contract> {
    return this.http.post<Contract>(`/api/Admin/bookings/${id}/reject`, req);
  }

  getAll(): Observable<Contract[]> {
    return this.http.get<Contract[]>(this.baseUrl);
  }

  getByBookingId(bookingId: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.baseUrl}/by-booking/${bookingId}`);
  }

  getPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  adminUploadContract(req: AdminContractUploadRequest): Observable<Contract> {
    const formData = new FormData();
    formData.append('bookingId', req.bookingId);
    formData.append('contractPdf', req.contractPdf);
    formData.append('adminUserId', req.adminUserId);
    return this.http.post<Contract>(`/api/Admin/bookings/${req.bookingId}/upload-contract`, formData);
  }
}
