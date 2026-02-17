import { fetchWithAuth } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Type definitions
export type ReviewCycleStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type ReviewType = 'SELF' | 'MANAGER' | 'PEER';

export interface ReviewConfig {
  id?: string;
  stepNumber: number;
  reviewType: ReviewType;
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewCycle {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ReviewCycleStatus;
  reviewConfigs: ReviewConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewCycleDto {
  name: string;
  startDate: string;
  endDate: string;
  reviewConfigs: Omit<ReviewConfig, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateReviewCycleDto {
  name?: string;
  startDate?: string;
  endDate?: string;
}

// API functions
export const reviewCyclesApi = {
  /**
   * Get all review cycles, optionally filtered by status
   */
  getAll: async (status?: ReviewCycleStatus): Promise<ReviewCycle[]> => {
    const url = status
      ? `${API_URL}/review-cycles?status=${status}`
      : `${API_URL}/review-cycles`;
    return fetchWithAuth(url);
  },

  /**
   * Get a single review cycle by ID
   */
  getOne: async (id: string): Promise<ReviewCycle> => {
    return fetchWithAuth(`${API_URL}/review-cycles/${id}`);
  },

  /**
   * Create a new review cycle with workflow configs
   */
  create: async (dto: CreateReviewCycleDto): Promise<ReviewCycle> => {
    return fetchWithAuth(`${API_URL}/review-cycles`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Update review cycle basic info (name, dates)
   */
  update: async (
    id: string,
    dto: UpdateReviewCycleDto,
  ): Promise<ReviewCycle> => {
    return fetchWithAuth(`${API_URL}/review-cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Update workflow step configurations
   */
  updateConfigs: async (
    id: string,
    configs: Omit<ReviewConfig, 'id' | 'createdAt' | 'updatedAt'>[],
  ): Promise<ReviewCycle> => {
    return fetchWithAuth(`${API_URL}/review-cycles/${id}/configs`, {
      method: 'PUT',
      body: JSON.stringify({ configs }),
    });
  },

  /**
   * Activate a review cycle (DRAFT -> ACTIVE)
   */
  activate: async (id: string): Promise<ReviewCycle> => {
    return fetchWithAuth(`${API_URL}/review-cycles/${id}/activate`, {
      method: 'POST',
    });
  },

  /**
   * Complete a review cycle (ACTIVE -> COMPLETED)
   */
  complete: async (id: string): Promise<ReviewCycle> => {
    return fetchWithAuth(`${API_URL}/review-cycles/${id}/complete`, {
      method: 'POST',
    });
  },

  /**
   * Delete a review cycle (DRAFT cycles only)
   */
  delete: async (id: string): Promise<void> => {
    return fetchWithAuth(`${API_URL}/review-cycles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper functions
export function getStatusColor(status: ReviewCycleStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'gray';
    case 'ACTIVE':
      return 'green';
    case 'COMPLETED':
      return 'blue';
    default:
      return 'gray';
  }
}

export function getReviewTypeColor(type: ReviewType): string {
  switch (type) {
    case 'SELF':
      return 'blue';
    case 'MANAGER':
      return 'green';
    case 'PEER':
      return 'purple';
    default:
      return 'gray';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
