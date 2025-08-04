"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import AnimatedBackground from "@/components/animated-background"
import { Code, Zap, Target, ArrowRight } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, isInitialized } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Redirect authenticated users to chat
    if (isInitialized && !isLoading && isAuthenticated) {
      router.replace("/chat")
    }
  }, [isAuthenticated, isLoading, isInitialized, router])

  // Show loading while checking auth state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render landing page for authenticated users
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-8xl font-bold mb-8 tracking-tight text-white"
          >
            Stepper.ai
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            Debug smarter with AI-powered step-by-step analysis. Get intelligent insights and solutions for your code
            with multiple AI providers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4 bg-white text-black hover:bg-gray-200 group">
                Start Debugging Smarter
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 bg-transparent border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            {
              icon: Code,
              title: "Step-by-Step Analysis",
              description:
                "Break down complex problems into manageable steps with AI guidance from multiple providers.",
            },
            {
              icon: Zap,
              title: "Multiple AI Providers",
              description: "Choose from OpenAI, Anthropic, Google AI, Groq, and Cohere for diverse AI perspectives.",
            },
            {
              icon: Target,
              title: "Smart Debugging",
              description: "Identify issues faster with intelligent code analysis and streaming responses.",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
