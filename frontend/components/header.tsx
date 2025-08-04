"use client"

import type React from "react"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Settings, LogOut, MessageSquare } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { toggleTheme } from "@/lib/slices/themeSlice"
import { authService } from "@/lib/auth/supabase-auth"
import { showNotification } from "@/components/notification"

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const isDark = useAppSelector((state) => state.theme.isDark)
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth)

  const handleLogout = async () => {
    try {
      const { error } = await authService.signOut()
      if (error) {
        showNotification({
          title: "Error",
          description: error,
          type: "error",
        })
        return
      }

      showNotification({
        title: "Success",
        description: "Logged out successfully",
        type: "success",
      })
      router.push("/")
    } catch (error) {
      showNotification({
        title: "Error",
        description: "Failed to log out",
        type: "error",
      })
    }
  }

  const NavButton = ({
    children,
    onClick,
    title,
    asChild = false,
    href,
    isActive = false,
  }: {
    children: React.ReactNode
    onClick?: () => void
    title?: string
    asChild?: boolean
    href?: string
    isActive?: boolean
  }) => {
    const buttonContent = (
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          title={title}
          className={`relative text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
            isActive ? "text-black dark:text-white bg-gray-100 dark:bg-gray-800" : ""
          }`}
        >
          {children}
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black dark:bg-white rounded-full"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </Button>
      </motion.div>
    )

    if (asChild && href) {
      return <Link href={href}>{buttonContent}</Link>
    }

    return buttonContent
  }

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
      case "/chat":
        return "Chat"
      case "/settings":
        return "Settings"
      case "/login":
        return "Login"
      case "/register":
        return "Register"
      default:
        return "Stepper.ai"
    }
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Link href={isAuthenticated ? "/" : "/"} className="text-2xl font-bold text-black dark:text-white">
              Stepper.ai
            </Link>
          </motion.div>

          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
            >
              <span>/</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{getPageTitle()}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <NavButton
            onClick={() => dispatch(toggleTheme())}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </NavButton>

          {!isLoading && (
            <>
              {isAuthenticated ? (
                <>
                  <NavButton asChild href="/" title="Chat" isActive={pathname === "/" || pathname === "/chat"}>
                    <MessageSquare className="h-5 w-5" />
                  </NavButton>

                  <NavButton asChild href="/settings" title="Settings" isActive={pathname === "/settings"}>
                    <Settings className="h-5 w-5" />
                  </NavButton>

                  <div className="hidden sm:flex items-center gap-3 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black dark:from-gray-200 dark:to-white rounded-full flex items-center justify-center text-white dark:text-black text-sm font-semibold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 max-w-24 truncate">{user?.name}</span>
                    </motion.div>
                  </div>

                  <NavButton onClick={handleLogout} title="Logout">
                    <LogOut className="h-5 w-5" />
                  </NavButton>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        className={`hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          pathname === "/login" ? "bg-gray-100 dark:bg-gray-800" : ""
                        }`}
                      >
                        Login
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        className={`bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 ${
                          pathname === "/register" ? "ring-2 ring-gray-400" : ""
                        }`}
                      >
                        Sign Up
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
