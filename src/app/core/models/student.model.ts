export interface UpdateStudentRequest {
  studentId: string;
  fullName: string;
  dateOfBirth: string;
  gender: number;
  address: string;
  city: string;
  preferredArea: string;
  nationalId: string;
}

export interface StudentResponse {
  studentId: string;
  userId: string;
  fullName?: string;
  dateOfBirth: string;
  gender: number;
  address: string;
  city: string;
  preferredArea: string;
  nationalId: string;
  facultyName: string;
  universityName: string;
  universityEmail: string;
  universityVerificationStatus: number;
}

export interface ChangePasswordRequest {
  studentId: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface GetStudentsRequest {
  city?: string;
  preferredArea?: string;
  gender?: number;
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedStudentResponse {
  pageSize: number;
  pageIndex: number;
  totalRecords: number;
  records: StudentResponse[];
}

export interface MultiRoomBookingRequest {
  studentId: string;
  roomIds: string[];
  startDate: string;
  endDate: string;
}
