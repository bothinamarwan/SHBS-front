export interface UpdateStudentRequest {
  studentId: string;
  fullName: string;
  dateOfBirth: string; // ISO format
  gender: number; // 0 or 1
  address: string;
  city: string;
  preferredArea: string;
  nationalId: string;
}

export interface StudentResponse {
  studentId: string;
  userId: string;
  dateOfBirth: string;
  gender: number;
  address: string;
  city: string;
  preferredArea: string;
  nationalId: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  verificationStatus: number;
}
