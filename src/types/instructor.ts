export interface InstructorSignupData {
  // Personal Details (Step 1)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  dateOfBirth: string;
  address: string;
  experience: number;
  
  // Vehicle Info (Step 2)
  vehicleRegistration: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  transmission: string;
  transmissionType: string;
  numberOfSeats: number;
  insuranceExpiry: string;
  carPhotos: File[];
  vehiclePhotos: File[];
  
  // Documents (Step 3)
  licenseFile: File | null;
  licenseExpiry: string;
  instructorLicense: File[];
  certificateFiles: File[];
  professionalCertificate: File | null;
  backgroundCheckConsent: boolean;
  
  // Terms (Step 4)
  termsAccepted: boolean;
  privacyAccepted: boolean;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}
