'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  reviewCyclesApi,
  ReviewCycle,
  UpdateReviewCycleDto,
  ReviewConfig,
} from '@/lib/review-cycles';
import ReviewCycleForm from '@/components/review-cycles/ReviewCycleForm';
import StatusBadge from '@/components/review-cycles/StatusBadge';

export default function EditReviewCyclePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [cycle, setCycle] = useState<ReviewCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCycle();
  }, [params.id]);

  const loadCycle = async () => {
    try {
      setLoading(true);
      const data = await reviewCyclesApi.getOne(params.id);
      setCycle(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load review cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    data: UpdateReviewCycleDto,
    configs?: ReviewConfig[],
  ) => {
    // Update basic info
    await reviewCyclesApi.update(params.id, data);

    // Update configs if provided
    if (configs) {
      await reviewCyclesApi.updateConfigs(params.id, configs);
    }

    router.push('/admin/review-cycles');
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading review cycle...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Review cycle not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Can only edit DRAFT cycles
  if (cycle.status !== 'DRAFT') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{cycle.name}</h1>
          <StatusBadge status={cycle.status} />
        </div>

        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Cannot Edit {cycle.status} Cycle
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                Only DRAFT cycles can be edited. This cycle is currently{' '}
                {cycle.status}.
              </p>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => router.push('/admin/review-cycles')}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  ← Back to Review Cycles
                </button>
                <button
                  onClick={() => router.push(`/admin/cycles/${params.id}/scores`)}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  📊 View Scores
                </button>
                <button
                  onClick={() =>
                    router.push(`/admin/review-cycles/${params.id}/assign-reviewers`)
                  }
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  👥 Assign Reviewers
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Read-only view */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Cycle Details
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{cycle.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={cycle.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(cycle.startDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(cycle.endDate).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Workflow Steps
            </h3>
            <div className="space-y-2">
              {cycle.reviewConfigs.map((config, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-md"
                >
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
                    {config.stepNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {config.reviewType} Review
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(config.startDate).toLocaleDateString()} -{' '}
                      {new Date(config.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Review Cycle
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the review cycle details and workflow configuration
        </p>
      </div>

      <ReviewCycleForm
        mode="edit"
        initialData={cycle}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
