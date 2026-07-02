export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'landlord' | 'admin';
  avatarUrl?: string;
  accountStatus?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  
  // Student specific fields
  studentId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  address?: string;
  city?: string;
  preferredArea?: string;
  nationalID?: string;

  // Landlord specific fields (for parity)
  landlordId?: string;
  companyName?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    roles: string[];
    studentId?: string;
    landLordId?: string;
  };
  requiresTwoFactor?: boolean;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  message: string;
  secret: string;
  qrCodeUri: string;
}

export interface TwoFactorRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}
