'use client';

import { useRouter } from 'next/navigation';
import { reviewCyclesApi, CreateReviewCycleDto } from '@/lib/review-cycles';
import ReviewCycleForm from '@/components/review-cycles/ReviewCycleForm';

export default function NewReviewCyclePage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateReviewCycleDto) => {
    await reviewCyclesApi.create(data);
    router.push('/admin/review-cycles');
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Review Cycle
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Set up a new performance review cycle with custom workflow steps
        </p>
      </div>

      <ReviewCycleForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
