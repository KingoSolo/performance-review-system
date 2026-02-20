interface AssignmentSummaryProps {
  totalEmployees: number;
  assignedEmployees: number;
}

export default function AssignmentSummary({
  totalEmployees,
  assignedEmployees,
}: AssignmentSummaryProps) {
  const percentage =
    totalEmployees > 0
      ? Math.round((assignedEmployees / totalEmployees) * 100)
      : 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Total Employees</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {totalEmployees}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">
            Employees with Assignments
          </p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {assignedEmployees}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">
            Completion Progress
          </p>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
