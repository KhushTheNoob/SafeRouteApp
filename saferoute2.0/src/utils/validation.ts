// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (basic)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Password validation (min 6 characters)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Name validation (not empty, reasonable length)
export const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
};

// Report title validation
export const isValidReportTitle = (title: string): boolean => {
  const trimmed = title.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
};

// Report description validation
export const isValidReportDescription = (description: string): boolean => {
  const trimmed = description.trim();
  return trimmed.length >= 10 && trimmed.length <= 500;
};

// Rating validation (1-5)
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// Coordinate validation
export const isValidCoordinate = (
  latitude: number,
  longitude: number
): boolean => {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

// Form validation helper
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (
  fields: Record<string, unknown>,
  validators: Record<string, (value: unknown) => string | null>
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [key, validator] of Object.entries(validators)) {
    const error = validator(fields[key]);
    if (error) {
      errors[key] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
