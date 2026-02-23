import { fetchWithAuth } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================================
// Types
// ============================================================================

export interface NotificationPreferences {
  cycleStarted: boolean;
  reviewAssigned: boolean;
  reminders: boolean;
  scoreAvailable: boolean;
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return fetchWithAuth(`${API_URL}/notifications/preferences`);
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<{ message: string }> {
  return fetchWithAuth(`${API_URL}/notifications/preferences`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}

/**
 * Send a test email (Admin only)
 */
export async function sendTestEmail(email?: string): Promise<TestEmailResponse> {
  const url = email
    ? `${API_URL}/notifications/test?email=${encodeURIComponent(email)}`
    : `${API_URL}/notifications/test`;

  return fetchWithAuth(url, {
    method: 'POST',
  });
}
