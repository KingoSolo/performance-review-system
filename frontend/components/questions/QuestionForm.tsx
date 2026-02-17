'use client';

import { useState, useEffect } from 'react';
import { Question, QuestionType, ReviewType, CreateQuestionDto } from '@/lib/questions';

interface QuestionFormProps {
  reviewType: ReviewType;
  question?: Question | null;
  onSubmit: (dto: CreateQuestionDto) => Promise<void>;
  onCancel: () => void;
}

export default function QuestionForm({
  reviewType,
  question,
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const [formData, setFormData] = useState<CreateQuestionDto>({
    reviewType,
    type: 'RATING',
    text: '',
    maxChars: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setFormData({
        reviewType: question.reviewType,
        type: question.type,
        text: question.text,
        maxChars: question.maxChars || undefined,
      });
    } else {
      setFormData({
        reviewType,
        type: 'RATING',
        text: '',
        maxChars: undefined,
      });
    }
  }, [question, reviewType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.text.trim()) {
      setError('Question text is required');
      return;
    }

    if (formData.type === 'TEXT' && formData.maxChars && formData.maxChars < 10) {
      setError('Max characters must be at least 10');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const questionTypes: { value: QuestionType; label: string; description: string }[] = [
    {
      value: 'RATING',
      label: 'Rating Scale',
      description: 'Employees rate from 1-5',
    },
    {
      value: 'TEXT',
      label: 'Text Response',
      description: 'Free-form text answer',
    },
    {
      value: 'TASK_LIST',
      label: 'Task List',
      description: 'List of tasks or goals',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {question ? 'Edit Question' : 'New Question'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Create a question for {reviewType.toLowerCase().replace('_', ' ')} reviews
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <div className="space-y-3">
            {questionTypes.map((type) => (
              <div key={type.value} className="flex items-start">
                <input
                  type="radio"
                  id={`type-${type.value}`}
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as QuestionType })
                  }
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor={`type-${type.value}`} className="ml-3 flex-1 cursor-pointer">
                  <span className="block text-sm font-medium text-gray-700">
                    {type.label}
                  </span>
                  <span className="block text-sm text-gray-500">{type.description}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Question Text <span className="text-red-500">*</span>
          </label>
          <textarea
            id="text"
            rows={4}
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            placeholder="Enter your question here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Be clear and specific. This is what reviewers will see.
          </p>
        </div>

        {/* Max Characters (for TEXT type) */}
        {formData.type === 'TEXT' && (
          <div>
            <label
              htmlFor="maxChars"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Maximum Characters (Optional)
            </label>
            <input
              type="number"
              id="maxChars"
              min="10"
              max="5000"
              value={formData.maxChars || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxChars: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="e.g., 500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for no limit. Recommended: 200-500 characters.
            </p>
          </div>
        )}

        {/* Preview */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-900 mb-3">
              {formData.text || 'Your question will appear here...'}
            </p>
            {formData.type === 'RATING' && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
            {formData.type === 'TEXT' && (
              <div>
                <textarea
                  rows={3}
                  placeholder="Reviewer's answer will go here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled
                />
                {formData.maxChars && (
                  <p className="mt-1 text-xs text-gray-500">
                    Max {formData.maxChars} characters
                  </p>
                )}
              </div>
            )}
            {formData.type === 'TASK_LIST' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" disabled />
                  <span className="text-sm text-gray-500">Task item example</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" disabled />
                  <span className="text-sm text-gray-500">Another task example</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
