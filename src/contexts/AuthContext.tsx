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
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentUserId')
    }
    return null
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Only load profile if this is the current user (not a newly created user)
        if (!currentUserId || currentUserId === session.user.id) {
          setCurrentUserId(session.user.id)
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentUserId', session.user.id)
          }
          await loadUserProfile(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setCurrentUserId(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentUserId')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [currentUserId])

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        // Check if this is the stored current user
        const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
        if (!storedUserId || storedUserId === currentUser.id) {
          setCurrentUserId(currentUser.id)
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentUserId', currentUser.id)
          }
          await loadUserProfile(currentUser.id)
        } else {
          // Different user signed in, load their profile
          setCurrentUserId(currentUser.id)
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentUserId', currentUser.id)
          }
          await loadUserProfile(currentUser.id)
        }
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
      setUser(profile)
      setLoading(false)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

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
