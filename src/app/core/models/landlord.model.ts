export interface Landlord {
  landlordId: string;
  userId?: string;
  fullName?: string;
  companyName?: string;
  nationalID?: string;
  nationalId?: string;
  propertyOwnershipProof?: string; // URL or reference to proof document
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'Approved';
  email?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  nationalIdImageUrl?: string;
  housingUnitDocumentationUrl?: string;
  propertyOwnerShipProof?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLandlordRequest {
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  companyName?: string;
  nationalId?: string;
  propertyOwnerShipProof?: string;
  profileImage?: string;
}

export interface UpdateLandlordRequest {
  landLordId?: string;
  companyName?: string;
  propertyOwnerShipProof?: string;
  nationalIdImageUrl?: string;
  housingUnitDocumentationUrl?: string;
}

export interface ChangePasswordRequest {
  studentId?: string; // As provided in the schema
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}
