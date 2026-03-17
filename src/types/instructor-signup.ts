/**
 * Type definitions for instructor signup flow
 */

export interface InstructorSignupFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  city: string;
  phone: string;
  dateOfBirth: string;
  address: string;

  // Step 2: Vehicle Information
  vehicleRegistration: string;
  vehicleBrand: string;
  vehicleYear: number | string;
  transmission: string;
  vehiclePhotos: File[];

  // Step 3: Documents
  instructorLicense: File[];
  professionalCertificate: File | null;

  // Step 4: Agreements
  backgroundCheckConsent: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface StepProps<T = InstructorSignupFormData> {
  data: T;
  updateData: (updates: Partial<T>) => void;
  errors?: Record<string, string>;
}

export interface ReviewStepProps extends StepProps {
  onEditStep: (step: number) => void;
}
