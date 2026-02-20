'use client';

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
    <div className="space-y-2">
      {/* Selected badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
            >
              {user.name}
              <button
                onClick={() => handleToggle(user.id)}
                type="button"
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <select
        multiple
        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        size={5}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map(
            (o) => o.value,
          );
          onChange(selected);
        }}
        value={selectedIds}
      >
        {availableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>

      <p className="text-xs text-gray-500">
        Hold Ctrl/Cmd to select multiple. Click badges above to remove.
      </p>
    </div>
  );
}
