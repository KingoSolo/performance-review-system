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

// ============================================================================
// API Functions
// ============================================================================

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return fetchWithAuth(`${API_URL}/notifications/preferences`);
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  await fetchWithAuth(`${API_URL}/notifications/preferences`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}
