"use client"

import type React from "react"

import { Provider } from "react-redux"
import { store } from "@/lib/store"
import ThemeProvider from "./theme-provider"
import AuthProvider from "./auth-provider"
import NotificationProvider from "./notification"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <NotificationProvider />
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  )
}
