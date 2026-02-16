import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Redirect to appropriate dashboard based on role
  switch (user.role) {
    case 'ADMIN':
      redirect('/admin')
    case 'MANAGER':
      redirect('/manager')
    case 'EMPLOYEE':
      redirect('/employee')
    default:
      redirect('/employee')
  }
}
