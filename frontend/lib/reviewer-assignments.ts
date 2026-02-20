import { fetchWithAuth } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Type definitions
export interface ReviewerAssignment {
  id: string;
  reviewCycleId: string;
  employeeId: string;
  reviewerId: string;
  reviewerType: 'MANAGER' | 'PEER';
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAssignments {
  employee: {
    id: string;
    name: string;
    email: string;
  };
  managers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  peers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export interface CreateAssignmentDto {
  reviewerId: string;
  reviewerType: 'MANAGER' | 'PEER';
}

export interface BulkCreateAssignmentsDto {
  reviewCycleId: string;
  employeeId: string;
  assignments: CreateAssignmentDto[];
}

export interface ImportAssignmentDto {
  employeeEmail: string;
  reviewerEmail: string;
  reviewerType: 'MANAGER' | 'PEER';
}

export interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
}

// API functions
export const reviewerAssignmentsApi = {
  /**
   * Get all assignments for a review cycle, grouped by employee
   */
  getByCycle: async (
    reviewCycleId: string,
  ): Promise<EmployeeAssignments[]> => {
    return fetchWithAuth(
      `${API_URL}/reviewer-assignments?reviewCycleId=${reviewCycleId}`,
    );
  },

  /**
   * Create/update assignments for a single employee
   */
  upsertForEmployee: async (
    dto: BulkCreateAssignmentsDto,
  ): Promise<ReviewerAssignment[]> => {
    return fetchWithAuth(`${API_URL}/reviewer-assignments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Bulk upsert for multiple employees
   */
  bulkUpsert: async (
    assignments: BulkCreateAssignmentsDto[],
  ): Promise<ImportResult> => {
    return fetchWithAuth(`${API_URL}/reviewer-assignments/bulk`, {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
  },

  /**
   * Import assignments from Excel/CSV
   */
  importAssignments: async (
    reviewCycleId: string,
    assignments: ImportAssignmentDto[],
  ): Promise<ImportResult> => {
    return fetchWithAuth(`${API_URL}/reviewer-assignments/import`, {
      method: 'POST',
      body: JSON.stringify({ reviewCycleId, assignments }),
    });
  },

  /**
   * Delete a specific assignment
   */
  remove: async (id: string): Promise<{ message: string }> => {
    return fetchWithAuth(`${API_URL}/reviewer-assignments/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Delete all assignments for an employee in a cycle
   */
  removeAllForEmployee: async (
    employeeId: string,
    reviewCycleId: string,
  ): Promise<{ message: string; count: number }> => {
    return fetchWithAuth(
      `${API_URL}/reviewer-assignments/employee/${employeeId}?reviewCycleId=${reviewCycleId}`,
      {
        method: 'DELETE',
      },
    );
  },
};
