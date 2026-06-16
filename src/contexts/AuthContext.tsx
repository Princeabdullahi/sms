'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserProfile, getCurrentUser, getUserProfile, signOut as authSignOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        await loadUserProfile(currentUser.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setLoading(false)
    }
  }

  async function loadUserProfile(userId: string) {
    try {
      const profile = await getUserProfile(userId)
      if (profile) {
        setUser(profile)
      } else {
        // If profile doesn't exist, create a default one
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user.email || '',
              full_name: userData.user.user_metadata?.full_name || 'User',
              role: 'student', // Default role
              phone: '',
            })
            .select()
            .single()
          
          if (!createError && newProfile) {
            setUser(newProfile)
          }
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (data.user) {
      await loadUserProfile(data.user.id)
      router.push('/dashboard')
    }
  }

  async function signOut() {
    await authSignOut()
    setUser(null)
    router.push('/login')
  }

  async function refreshUser() {
    const currentUser = await getCurrentUser()
    if (currentUser) {
      await loadUserProfile(currentUser.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
