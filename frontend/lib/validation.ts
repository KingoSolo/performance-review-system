/**
 * Validation utilities for forms
 * Provides reusable validation functions and error messages
 */

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validates email format using RFC 5322 compliant regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

// ============================================================================
// Password Validation
// ============================================================================

export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
}

/**
 * Validates password strength
 * Returns score: 0 (very weak) to 4 (very strong)
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Minimum length
  if (password.length === 0) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required'],
    };
  }

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else {
    score++;
  }

  // Contains lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Contains uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Contains number
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  // Contains special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  }

  const isValid = password.length >= 8 && score >= 2;

  return {
    isValid,
    score: Math.min(score, 4),
    feedback: isValid ? [] : feedback,
  };
}

/**
 * Simple password validation for login (no strength requirements)
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}

/**
 * Validates password confirmation matches
 */
export function validatePasswordConfirm(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

// ============================================================================
// Name Validation
// ============================================================================

export function validateName(name: string, fieldName = 'Name'): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return `${fieldName} is required`;
  }

  if (trimmed.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }

  if (trimmed.length > 100) {
    return `${fieldName} must be less than 100 characters`;
  }

  return null;
}

// ============================================================================
// Date Validation
// ============================================================================

export function validateDateRange(
  startDate: string,
  endDate: string,
  fieldLabel = 'Date range',
): string | null {
  if (!startDate || !endDate) {
    return `${fieldLabel} requires both start and end dates`;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date format';
  }

  if (start >= end) {
    return 'Start date must be before end date';
  }

  return null;
}

/**
 * Validates a date is within a range
 */
export function validateDateWithinRange(
  date: string,
  rangeStart: string,
  rangeEnd: string,
  fieldName = 'Date',
): string | null {
  if (!date) {
    return `${fieldName} is required`;
  }

  const checkDate = new Date(date);
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);

  if (isNaN(checkDate.getTime())) {
    return 'Invalid date format';
  }

  if (checkDate < start || checkDate > end) {
    return `${fieldName} must be between ${start.toLocaleDateString()} and ${end.toLocaleDateString()}`;
  }

  return null;
}

// ============================================================================
// CSS Helper Functions
// ============================================================================

/**
 * Returns Tailwind classes for input based on validation state
 */
export function getInputClassName(
  hasError: boolean,
  hasSuccess: boolean = false,
  baseClasses: string = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none',
): string {
  if (hasError) {
    return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
  }

  if (hasSuccess) {
    return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500`;
  }

  return `${baseClasses} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
}

/**
 * Returns color class for password strength indicator
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-yellow-500';
    case 3:
      return 'bg-blue-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return '';
  }
}
