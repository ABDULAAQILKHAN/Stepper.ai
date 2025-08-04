"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface Notification {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "info"
  variant?: "destructive" | "default"
  duration?: number
}

let notificationQueue: Notification[] = []
let setNotifications: ((notifications: Notification[]) => void) | null = null

export const showNotification = (notification: Omit<Notification, "id">) => {
  const id = Date.now().toString()
  // Convert variant to type for backward compatibility
  const type = notification.variant === "destructive" ? "error" : notification.type || "info"
  const newNotification = { ...notification, id, type }
  notificationQueue.push(newNotification)

  if (setNotifications) {
    setNotifications([...notificationQueue])
  }

  // Auto remove after duration
  setTimeout(() => {
    notificationQueue = notificationQueue.filter((n) => n.id !== id)
    if (setNotifications) {
      setNotifications([...notificationQueue])
    }
  }, notification.duration || 5000)
}

export default function NotificationProvider() {
  const [notifications, setNotificationsState] = useState<Notification[]>([])

  useEffect(() => {
    setNotifications = setNotificationsState
    return () => {
      setNotifications = null
    }
  }, [])

  const removeNotification = (id: string) => {
    notificationQueue = notificationQueue.filter((n) => n.id !== id)
    setNotificationsState([...notificationQueue])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    }
  }

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`max-w-sm p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getColors(notification.type)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{notification.title}</h4>
                {notification.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.description}</p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
