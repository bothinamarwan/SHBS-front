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
    return this.http.put(`${this.baseUrl}/ChangePassword`, passwordData);
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
    // Since the MyVerificationStatus endpoint doesn't exist on the backend,
    // we'll return the verification status from localStorage student data
    return new Observable((observer) => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');
        
        console.log('Verification Status Debug - All localStorage keys:', Object.keys(localStorage));
        console.log('Verification Status Debug - currentUser:', currentUser);
        console.log('Verification Status Debug - studentData:', studentData);
        
        // Check all possible localStorage keys for student data
        const allKeys = Object.keys(localStorage);
        let foundStudentData: any = null;
        allKeys.forEach(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.universityVerificationStatus !== undefined || data.verificationStatus !== undefined) {
              console.log(`Verification Status Debug - Found verification status in key '${key}':`, data);
              foundStudentData = data;
            }
          } catch (e) {
            // Skip non-JSON values
          }
        });
        
        // Check multiple possible sources for verification status
        const verificationStatus = 
          foundStudentData?.universityVerificationStatus ||
          foundStudentData?.verificationStatus ||
          currentUser?.universityVerificationStatus ||
          studentData?.universityVerificationStatus ||
          currentUser?.verificationStatus ||
          studentData?.verificationStatus ||
          currentUser?.isVerified ||
          studentData?.isVerified;
        
        console.log('Verification Status Debug - found status:', verificationStatus);
        
        // Backend enum: NotSubmitted=0, Pending=1, Approved=2, Rejected=3
        // Only consider student verified if verification status is explicitly approved (2)
        const isVerified = verificationStatus === 2 || verificationStatus === 'Approved' || verificationStatus === true || verificationStatus === 'true';
        
        console.log('Verification Status Debug - isVerified:', isVerified);
        
        observer.next({
          isVerified: isVerified,
          status: verificationStatus === 2 ? 'Approved' : verificationStatus,
          verificationStatus: verificationStatus
        });
        observer.complete();
      } catch (error) {
        console.error('Verification Status Debug - error:', error);
        observer.next({ isVerified: false, status: 'Unknown', verificationStatus: 0 });
        observer.complete();
      }
    });
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
