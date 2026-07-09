export enum ComplaintStatus {
  Open = 0,
  InInvestigation = 1,
  Resolved = 2
}

export interface Complaint {
  complaintId: string;
  title: string;
  studentId: string;
  housingUnitId: string;
  description: string;
  status: ComplaintStatus;
  createdAt?: string;
  updatedAt?: string;
  studentName?: string;
  housingUnitTitle?: string;
  landlordId?: string;
}

export interface CreateComplaintRequest {
  title: string;
  studentId: string;
  housingUnitId: string;
  description: string;
}

export interface UpdateComplaintRequest {
  complaintId: string;
  status: ComplaintStatus;
}
