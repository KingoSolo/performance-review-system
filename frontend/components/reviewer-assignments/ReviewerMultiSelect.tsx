'use client';

import { useState } from 'react';
import { User } from '@/lib/api';

interface ReviewerMultiSelectProps {
  selectedIds: string[];
  availableUsers: User[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export default function ReviewerMultiSelect({
  selectedIds,
  availableUsers,
  onChange,
  placeholder = 'Select reviewers...',
}: ReviewerMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const selectedUsers = availableUsers.filter((u) =>
    selectedIds.includes(u.id),
  );

  return (
    <div className="relative space-y-2">
      {/* Selected badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-800 text-sm rounded-full font-medium"
            >
              {user.name}
              <button
                onClick={() => handleToggle(user.id)}
                type="button"
                className="ml-1 inline-flex items-center justify-center w-4 h-4 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-200 rounded-full"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="text-gray-700">
          {selectedUsers.length > 0
            ? `${selectedUsers.length} selected`
            : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu with checkboxes */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {availableUsers.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No users available
            </div>
          ) : (
            availableUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => handleToggle(user.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-900">
                  {user.name}
                  <span className="ml-2 text-gray-500 text-xs">
                    ({user.email})
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Click the dropdown to select multiple reviewers
      </p>
    </div>
  );
}
