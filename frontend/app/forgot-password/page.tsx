"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/lib/auth/supabase-auth"
import { showNotification } from "@/components/notification"
import AnimatedBackground from "@/components/animated-background"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Email is required")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await authService.resetPassword(email)

      if (error) {
        showNotification({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return
      }

      setIsSubmitted(true)
      showNotification({
        title: "Success",
        description: "Password reset instructions sent to your email",
      })
    } catch (error) {
      showNotification({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Rest of the component JSX remains the same...
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center relative">
        <AnimatedBackground />

        <div className="relative z-10 w-full max-w-md px-4">
          <Card className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {"Didn't receive the email? Check your spam folder or "}
                <button onClick={() => setIsSubmitted(false)} className="text-black dark:text-white hover:underline">
                  try again
                </button>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center relative">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">Enter your email to receive reset instructions</p>
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
                  className={error ? "border-red-500" : ""}
                  placeholder="Enter your email address"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
