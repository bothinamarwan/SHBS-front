import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateStudentRequest, StudentResponse } from '../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private baseUrl = '/api/v1/Student';

  constructor(private http: HttpClient) {}

  updateStudent(studentData: UpdateStudentRequest): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(`${this.baseUrl}/update`, studentData);
  }

  getStudent(id: string | number): Observable<any> {
    return this.http.get(`${this.baseUrl}/GetStudent/${id}`);
  }

  getAllStudents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAll`);
  }

  getAllFiltered(filterParams: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/GetAllFiltered`, filterParams);
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ChangePassword`, passwordData);
  }

  setDeletion(id: string | number): Observable<any> {
    return this.http.post(`${this.baseUrl}/SetDeletion/${id}`, {});
  }
}
