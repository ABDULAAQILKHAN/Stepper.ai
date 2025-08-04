"use client"

import type React from "react"

import { useEffect } from "react"
import { useAppDispatch } from "@/lib/hooks"
import { setUser, setLoading } from "@/lib/slices/authSlice"
import { authService } from "@/lib/auth/supabase-auth"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      dispatch(setLoading(true))
      const user = await authService.getCurrentUser()
      dispatch(setUser(user))
    }

    getInitialUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange((user) => {
      dispatch(setUser(user))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch])

  return <>{children}</>
}
