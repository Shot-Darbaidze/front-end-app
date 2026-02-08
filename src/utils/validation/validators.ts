export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
export const nameRegex = /^[a-zA-Z\s'-]{2,}$/;

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  if (!phoneRegex.test(phone)) return 'Invalid phone number format';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain number';
  return null;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) return 'Name is required';
  if (!nameRegex.test(name)) return 'Name must be 2+ characters and contain only letters';
  return null;
};

export const validateDate = (date: string): string | null => {
  if (!date) return 'Date is required';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid date format';
  return null;
};

export const validateAge = (birthDate: string, minAge: number = 18): string | null => {
  const dateObj = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - dateObj.getFullYear();
  const monthDifference = today.getMonth() - dateObj.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateObj.getDate())) {
    age--;
  }

  if (age < minAge) return `Must be at least ${minAge} years old`;
  return null;
};

export const validateFileSize = (file: File, maxSizeMB: number = 5): string | null => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) return `File size must not exceed ${maxSizeMB}MB`;
  return null;
};

export const validateFileType = (file: File, allowedTypes: string[]): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }
  return null;
};
