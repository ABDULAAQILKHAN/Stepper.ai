"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AnimatedBackground from "@/components/animated-background"
import { showNotification } from "@/components/notification"
import { setUser } from "@/lib/slices/authSlice"
import { useDispatch } from "react-redux"
import { connect } from "@/lib/api/api"
import { authService } from "@/lib/auth/supabase-auth"

interface SyncResponse {
  success: boolean;
}
/**
 * LoginPage component for user authentication.
 * It handles user login, form validation, and error handling.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const dispatch = useDispatch()

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const { user, error } = await authService.signIn(email, password)

      if (error) {
        showNotification({
          title: "Error",
          description: error,
          variant: "destructive",
          type: "error",
        })
        return
      }

      if (user) {
        dispatch(setUser({
          id: user.id,
          email: user.email,
          name: user.name,
          token: user.token || "",
        }))
        if( user.token) {
          localStorage.setItem("token", user.token);
        }
        const syncResponse:SyncResponse = await connect.sync()
        if (!syncResponse.success){
          showNotification({
            title: "Sync Error",
            description: "Failed to sync login details. Please try again later.",
            variant: "destructive",
            type: "error",
          })
          return
        }
        showNotification({
          title: "Success",
          type: "success",
          variant: "default",
          description: "Logged in successfully!",
        })
        router.push("/chat")
      }
    } catch (error) {
      showNotification({
        title: "Error",
        type: "error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center relative">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link href="/forgot-password" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                Forgot your password?
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {"Don't have an account? "}
                <Link href="/register" className="text-black dark:text-white hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
