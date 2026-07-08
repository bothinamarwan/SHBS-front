import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  UpdateStudentRequest,
  StudentResponse,
  ChangePasswordRequest,
  GetStudentsRequest,
  PaginatedStudentResponse,
  MultiRoomBookingRequest
} from '../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private baseUrl = '/api/v1/Student';

  constructor(private http: HttpClient) {}

  createStudent(studentData: any): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(`${this.baseUrl}/Create`, studentData);
  }

  updateStudent(studentData: UpdateStudentRequest): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.baseUrl}/Update`, studentData);
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/ChangePassword`, passwordData);
  }

  deleteStudent(studentId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Delete/${studentId}`);
  }

  getStudentById(studentId: string): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.baseUrl}/GetById/${studentId}`);
  }

  getStudentByUserId(userId: string): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.baseUrl}/GetByUserId/${userId}`);
  }

  getStudents(filterParams: GetStudentsRequest): Observable<PaginatedStudentResponse> {
    let params = new HttpParams();
    if (filterParams.city) params = params.set('city', filterParams.city);
    if (filterParams.preferredArea) params = params.set('preferredArea', filterParams.preferredArea);
    if (filterParams.gender !== undefined) params = params.set('gender', filterParams.gender);
    if (filterParams.dateOfBirthFrom) params = params.set('dateOfBirthFrom', filterParams.dateOfBirthFrom);
    if (filterParams.dateOfBirthTo) params = params.set('dateOfBirthTo', filterParams.dateOfBirthTo);
    if (filterParams.pageNumber !== undefined) params = params.set('pageNumber', filterParams.pageNumber);
    if (filterParams.pageSize !== undefined) params = params.set('pageSize', filterParams.pageSize);

    return this.http.get<PaginatedStudentResponse>(`${this.baseUrl}/GetStudents`, { params });
  }

  deactivateStudent(studentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/Deactivate/${studentId}`, {});
  }

  reactivateStudent(studentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/Reactivate/${studentId}`, {});
  }

  validateNationalId(nationalId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/ValidateNationalId/${nationalId}`);
  }

  submitUniversityVerification(data: any): Observable<any> {
    console.log('Submitting university verification to:', `${this.baseUrl}/SubmitUniversityVerification`);
    console.log('FormData data:', data);
    return this.http.post(`${this.baseUrl}/SubmitUniversityVerification`, data);
  }

  getMyVerificationStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/MyVerificationStatus`);
  }

  getMyBookings(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/MyBookings`).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        return res?.records || [];
      })
    );
  }

  multiRoomBooking(bookingData: MultiRoomBookingRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/MultiRoomBooking`, bookingData);
  }
}
