import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  companyId: string
  companyName: string
}

export async function getSession() {
  console.log('📱 Getting session from Supabase...')

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Error getting session:', error.message)
      return null
    }

    if (session) {
      console.log('✅ Session found:', session.user.email)
      console.log('   Token expires at:', new Date(session.expires_at! * 1000).toLocaleString())
    } else {
      console.log('⚠️  No session found in storage')
    }

    return session
  } catch (error) {
    console.error('❌ Exception getting session:', error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  console.log('👤 Getting current user...')
  const session = await getSession()
  if (!session) {
    console.log('❌ No session, cannot get user')
    return null
  }

  try {
    console.log('📡 Fetching user from API...')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      console.error('❌ API returned error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error body:', errorText)
      return null
    }

    const user = await response.json()
    console.log('✅ User fetched successfully:', user.email)
    return user
  } catch (error) {
    console.error('❌ Error fetching user:', error)
    return null
  }
}

export async function signIn(email: string, password: string) {
  console.log('🔑 Signing in:', email)
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Sign in failed:', error.message)
    throw new Error(error.message || 'Sign in failed')
  }

  const data = await response.json()
  console.log('✅ Sign in response received')

  // Set the session in Supabase client
  if (data.session) {
    console.log('💾 Setting session in Supabase client...')
    const { error } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    if (error) {
      console.error('❌ Error setting session:', error)
      throw new Error('Failed to persist session')
    } else {
      console.log('✅ Session set successfully')
      // Wait a moment to ensure session is persisted to storage
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('✅ Session persistence confirmed')
    }
  } else {
    console.warn('⚠️  No session in response')
  }

  return data
}

export async function signUp(email: string, password: string, name: string, companyName: string) {
  console.log('📝 Signing up:', email)
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name, companyName }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Sign up failed:', error.message)
    throw new Error(error.message || 'Sign up failed')
  }

  const data = await response.json()
  console.log('✅ Sign up response received')

  // Set the session in Supabase client
  if (data.session) {
    console.log('💾 Setting session in Supabase client...')
    const { error } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    if (error) {
      console.error('❌ Error setting session:', error)
      throw new Error('Failed to persist session')
    } else {
      console.log('✅ Session set successfully')
      // Wait a moment to ensure session is persisted to storage
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('✅ Session persistence confirmed')
    }
  } else {
    console.warn('⚠️  No session in response')
  }

  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}
