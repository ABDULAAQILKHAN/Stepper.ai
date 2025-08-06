"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, AlertCircle, Bot, User, Copy, Check } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
import AnimatedBackground from "@/components/animated-background"
import ProtectedRoute from "@/components/protected-route"
import { chatService } from "@/lib/ai/chat-service"
import { getProviderById } from "@/lib/ai/providers"
import ReactMarkdown from "react-markdown"
import CodeBlock from "@/components/code-block"
import { showNotification } from "@/components/notification"
import {connect} from "@/lib/api/api"
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  isStreaming?: boolean
}

function ChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [currentConfig, setCurrentConfig] = useState<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  const getSelectedAiModel = async () => {
    const response = await connect.getSelectedAiModel()
    console.log("getSelectedAiModel response", response)
    if (!response) {
      showNotification({
        title: "Error",
        description: "Failed to fetch selected AI model",
        type: "error",
      })
      return
    }
    setCurrentConfig(response)
  }

  useEffect(() => {
    getSelectedAiModel()
  }, [])
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
      showNotification({
        title: "Copied!",
        description: "Message copied to clipboard",
        type: "success",
      })
    } catch (error) {
      showNotification({
        title: "Error",
        description: "Failed to copy message",
        type: "error",
      })
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    if (!currentConfig?.api_key) {
      showNotification({
        title: "API Key Required",
        description: `Please set your ${getProviderById(currentConfig)?.name} API key in settings.`,
        type: "error",
      })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsTyping(true)
    setStreamingMessageId(assistantMessageId)

    const chatMessages = [...messages, userMessage].map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    let fullContent = ""

    try {
      await chatService.streamChat(
        chatMessages,
        currentConfig.model_id,
        currentConfig.api_key,
        currentConfig.model,
        (chunk) => {
          if (chunk.error) {
            showNotification({
              title: "Error",
              description: chunk.error,
              type: "error",
            })
            setIsTyping(false)
            setStreamingMessageId(null)
            return
          }

          if (chunk.isComplete) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg)),
            )
            setIsTyping(false)
            setStreamingMessageId(null)
          } else {
            fullContent += chunk.content
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg)),
            )
          }
        },
      )
    } catch (error) {
      showNotification({
        title: "Error",
        description: "Failed to send message. Please try again.",
        type: "error",
      })
      setIsTyping(false)
      setStreamingMessageId(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const MessageBubble = ({ message, index }: { message: Message; index: number }) => {
    const isUser = message.role === "user"
    const isStreaming = message.isStreaming && streamingMessageId === message.id

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 group`}
      >
        <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              isUser
                ? "bg-gradient-to-br from-gray-800 to-black text-white"
                : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </motion.div>

          {/* Message Content */}
          <div className="relative">
            <div
              className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm border ${
                isUser
                  ? "bg-gradient-to-br from-gray-900 to-black text-white border-gray-700"
                  : "bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 border-gray-200/50 dark:border-gray-700/50"
              }`}
            >
              {/* Copy button */}
              {!isUser && message.content && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {copiedMessageId === message.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  )}
                </motion.button>
              )}

              <div className="relative z-10">
                {isUser ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }:any) {
                          const match = /language-(\w+)/.exec(className || "")
                          const language = match ? match[1] : undefined

                          return !inline ? (
                            <CodeBlock language={language} className={className}>
                              {String(children).replace(/\n$/, "")}
                            </CodeBlock>
                          ) : (
                            <code
                              className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-gray-100">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-3 text-gray-800 dark:text-gray-200 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800 dark:text-gray-200">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800 dark:text-gray-200">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 mb-3">
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
                        ),
                        em: ({ children }) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {isStreaming && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    className="inline-block w-2 h-4 bg-current ml-1 rounded-sm"
                  />
                )}
              </div>

              {/* Timestamp */}
              <div className={`text-xs mt-3 ${isUser ? "text-white/60" : "text-gray-500 dark:text-gray-400"}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">AI Debug Assistant</h1>

          {currentConfig && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>
                Powered by {currentConfig?.name} • {currentConfig?.model}
              </span>
            </div>
          )}
        </motion.div>

        {/* API Key Warning */}
        <AnimatePresence>
          {!currentConfig?.api_key && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-4 mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-900/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5" />
                  <span>Please configure your AI provider in settings to start chatting.</span>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-800/30 shadow-2xl h-[70vh] flex flex-col overflow-hidden"
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 mt-20"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                    className="mb-4"
                  >
                    <Bot className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Welcome to Stepper.ai</h3>
                  <p>Start a conversation to begin step-by-step debugging assistance.</p>
                </motion.div>
              ) : (
                messages.map((message, index) => <MessageBubble key={message.id} message={message} index={index} />)
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 dark:border-gray-800/30 p-6 bg-white/5 dark:bg-black/10 backdrop-blur-sm">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your debugging challenge..."
                className="pr-14 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/30 dark:border-gray-700/50 rounded-2xl h-14 text-base shadow-lg focus:ring-2 focus:ring-white/20 dark:focus:ring-gray-600/50 transition-all duration-200"
                disabled={isTyping}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 top-2"
              >
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  )
}
