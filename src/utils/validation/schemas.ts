import { ValidationRules } from '@/hooks/useForm';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateAge,
  validatePhone,
} from './validators';

// Login form validation
export const loginValidation: Record<string, ValidationRules> = {
  email: {
    required: 'Email is required',
    custom: validateEmail,
  },
  password: {
    required: 'Password is required',
    minLength: { value: 6, message: 'Password must be at least 6 characters' },
  },
};

// Sign up form validation
export const signupValidation: Record<string, ValidationRules> = {
  firstName: {
    required: 'First name is required',
    custom: validateName,
  },
  lastName: {
    required: 'Last name is required',
    custom: validateName,
  },
  email: {
    required: 'Email is required',
    custom: validateEmail,
  },
  phone: {
    required: 'Phone number is required',
    custom: validatePhone,
  },
  password: {
    required: 'Password is required',
    custom: validatePassword,
  },
  confirmPassword: {
    required: 'Please confirm your password',
    custom: validatePassword,
  },
  acceptTerms: {
    required: 'You must accept terms and conditions',
  },
};

// Personal info form validation
export const personalInfoValidation: Record<string, ValidationRules> = {
  firstName: {
    required: 'First name is required',
    custom: validateName,
  },
  lastName: {
    required: 'Last name is required',
    custom: validateName,
  },
  email: {
    required: 'Email is required',
    custom: validateEmail,
  },
  phone: {
    required: 'Phone number is required',
    custom: validatePhone,
  },
  dateOfBirth: {
    required: 'Date of birth is required',
    custom: (value) => validateAge(value, 18),
  },
  city: {
    required: 'City is required',
    minLength: { value: 2, message: 'City name must be at least 2 characters' },
  },
  address: {
    required: 'Address is required',
    minLength: { value: 5, message: 'Address must be at least 5 characters' },
  },
};

// Instructor signup step 1 - Personal Details
export const instructorStep1Validation: Record<string, ValidationRules> = {
  firstName: {
    required: 'First name is required',
    custom: validateName,
  },
  lastName: {
    required: 'Last name is required',
    custom: validateName,
  },
  email: {
    required: 'Email is required',
    custom: validateEmail,
  },
  phone: {
    required: 'Phone number is required',
    custom: validatePhone,
  },
  dateOfBirth: {
    required: 'Date of birth is required',
    custom: (value) => validateAge(value, 18),
  },
  city: {
    required: 'City is required',
  },
};

// Instructor signup step 2 - Vehicle Info
export const instructorStep2Validation: Record<string, ValidationRules> = {
  transmission: {
    required: 'Transmission type is required',
  },
  vehicleModel: {
    required: 'Vehicle model is required',
    minLength: { value: 3, message: 'Vehicle model must be at least 3 characters' },
  },
  vehicleYear: {
    required: 'Vehicle year is required',
    custom: (value) => {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (year < currentYear - 20) return 'Vehicle must not be older than 20 years';
      if (year > currentYear) return 'Vehicle year cannot be in the future';
      return null;
    },
  },
  numberOfSeats: {
    required: 'Number of seats is required',
    custom: (value) => {
      const seats = parseInt(value);
      if (seats < 2 || seats > 8) return 'Vehicle must have 2-8 seats';
      return null;
    },
  },
};

// Instructor signup step 3 - Documents
export const instructorStep3Validation: Record<string, ValidationRules> = {
  insuranceExpiry: {
    required: 'Insurance expiry date is required',
    custom: (value) => {
      const date = new Date(value);
      if (date < new Date()) return 'Insurance must not be expired';
      return null;
    },
  },
  licenseExpiry: {
    required: 'License expiry date is required',
    custom: (value) => {
      const date = new Date(value);
      if (date < new Date()) return 'License must not be expired';
      return null;
    },
  },
};

// Instructor signup step 4 - Terms
export const instructorStep4Validation: Record<string, ValidationRules> = {
  acceptTerms: {
    required: 'You must accept terms and conditions',
  },
  acceptPrivacy: {
    required: 'You must accept privacy policy',
  },
  backgroundCheckConsent: {
    required: 'You must consent to background check',
  },
};

// Password change form validation
export const passwordChangeValidation: Record<string, ValidationRules> = {
  currentPassword: {
    required: 'Current password is required',
  },
  newPassword: {
    required: 'New password is required',
    custom: validatePassword,
  },
  confirmPassword: {
    required: 'Please confirm your new password',
    custom: validatePassword,
  },
};
