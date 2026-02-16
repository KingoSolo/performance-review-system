'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'

interface User {
  id: string
  email: string
  name: string
  role: string
  companyName: string
}

export default function DashboardNav({ user }: { user: User }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Performance Review System
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-gray-500">{user.role} • {user.companyName}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
