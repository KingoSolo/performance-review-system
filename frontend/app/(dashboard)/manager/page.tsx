'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';
import { reviewCyclesApi, ReviewCycle } from '@/lib/review-cycles';

export default function ManagerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeCycles, setActiveCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Fetch active review cycles
      try {
        const cycles = await reviewCyclesApi.getAll('ACTIVE');
        setActiveCycles(cycles);
      } catch (apiError: any) {
        console.error('API error (non-fatal):', apiError.message);
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Manager Dashboard
        </h2>
        <p className="text-gray-600 mb-6">
          Welcome back, {user.name}! Manage your team's performance reviews.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Team Members
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">-</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Reviews
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">-</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">-</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Review Cycles */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Active Review Cycles
          </h3>
          {activeCycles.length === 0 ? (
            <div className="bg-white shadow sm:rounded-lg p-6 text-center">
              <p className="text-gray-500">
                No active review cycles at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="bg-white shadow sm:rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {cycle.name}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(cycle.startDate).toLocaleDateString()} -{' '}
                        {new Date(cycle.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          router.push(`/manager/reviews?cycleId=${cycle.id}`)
                        }
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Review Team Members
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/employee/reviews/self?cycleId=${cycle.id}`,
                          )
                        }
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        My Self Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team List Placeholder */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">My Team</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              <li className="px-6 py-4 text-center text-gray-500">
                No team members to display. Team members will appear here once assigned.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
