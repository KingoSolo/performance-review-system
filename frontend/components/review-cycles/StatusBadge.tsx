import { ReviewCycleStatus, getStatusColor } from '@/lib/review-cycles';

interface StatusBadgeProps {
  status: ReviewCycleStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);

  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[colorClass as keyof typeof colorMap] || colorMap.gray}`}
    >
      {status}
    </span>
  );
}
