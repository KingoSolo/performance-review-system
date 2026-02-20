import { fetchWithAuth } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================================
// Types
// ============================================================================

export interface Answer {
  questionId: string;
  rating?: number | null;
  textAnswer?: string | null;
}

export interface QuestionWithAnswer {
  id: string;
  reviewType: string;
  type: 'RATING' | 'TEXT' | 'TASK_LIST';
  text: string;
  maxChars: number | null;
  order: number;
  answer?: {
    id: string;
    rating: number | null;
    textAnswer: string | null;
  } | null;
}

export interface SelfReviewData {
  review: {
    id: string;
    reviewCycleId: string;
    employeeId: string;
    reviewType: string;
    status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';
    updatedAt: string;
  };
  questions: QuestionWithAnswer[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get self-review for current user in cycle
 * Auto-creates if doesn't exist
 */
export async function getSelfReview(cycleId: string): Promise<SelfReviewData> {
  return fetchWithAuth(`${API_URL}/reviews/self/${cycleId}`);
}

/**
 * Save draft answers (auto-save)
 */
export async function saveDraft(
  cycleId: string,
  answers: Answer[],
): Promise<{ message: string; updatedAt: string }> {
  return fetchWithAuth(`${API_URL}/reviews/self/${cycleId}/draft`, {
    method: 'PATCH',
    body: JSON.stringify({ answers }),
  });
}

/**
 * Submit review (final)
 */
export async function submitReview(
  cycleId: string,
  answers: Answer[],
): Promise<{ message: string }> {
  return fetchWithAuth(`${API_URL}/reviews/self/${cycleId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}
