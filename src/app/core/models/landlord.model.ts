export interface Landlord {
  landlordId: string;
  fullName: string;
  companyName?: string;
  nationalID: string;
  propertyOwnershipProof: string; // URL or reference to proof document
  verificationStatus: 'pending' | 'verified' | 'rejected';
}
