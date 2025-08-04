"use client"

import type React from "react"

import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { setTheme } from "@/lib/slices/themeSlice"

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useAppSelector((state) => state.theme.isDark)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      dispatch(setTheme(savedTheme === "dark"))
    }
  }, [dispatch])

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light")
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  return <>{children}</>
}
