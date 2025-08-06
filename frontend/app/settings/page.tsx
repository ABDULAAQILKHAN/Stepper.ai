"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { setAIConfig, removeAIConfig, setSelectedProvider } from "@/lib/slices/settingsSlice"
import AnimatedBackground from "@/components/animated-background"
import ProtectedRoute from "@/components/protected-route"
import { Eye, EyeOff, Key, Trash2, Plus, Bot, Shield, Database, Zap } from "lucide-react"
import { AI_PROVIDERS, validateApiKey, getProviderById } from "@/lib/ai/providers"
import { showNotification } from "@/components/notification"
import { connect } from "@/lib/api/api"
import Loader from "@/components/ui/loader"

interface AIModel {
  id: string;
  model_id: string;
  name: string;
  api_key: string;
  model: string;
}
interface deleteUserAiModalResponse {
  success: boolean;
  message?: string;
  error?: string | null;
}
function SettingsPageContent() {
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [newModelSelection, setNewModelSelection] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const { aiConfigs } = useAppSelector((state) => state.settings)

  // Fetch all AI models and selected model on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch all available AI models
        const modelsResponse = await connect.getUserAiModals()
        if (modelsResponse) {
          setAiModels(modelsResponse)
          
          // Initialize states
          const initialApiKeys: Record<string, string> = {}
          const initialShowApiKeys: Record<string, boolean> = {}
          const initialModelSelections: Record<string, string> = {}

          modelsResponse.forEach((model: AIModel) => {
            initialApiKeys[model.model_id] = model.api_key
            initialShowApiKeys[model.model_id] = false
            initialModelSelections[model.model_id] = model.model
          })

          setApiKeys(initialApiKeys)
          setShowApiKeys(initialShowApiKeys)
          setNewModelSelection(initialModelSelections)

          // Update Redux store
          modelsResponse.forEach((model: AIModel) => {
            dispatch(setAIConfig({
              providerId: model.model_id,
              apiKey: model.api_key,
              model: model.model
            }))
          })
        }

        // Fetch selected model
        const selectedResponse = await connect.getSelectedAiModel()
        if (selectedResponse?.model_id) {
          setSelectedModelId(selectedResponse.model_id)
          dispatch(setSelectedProvider(selectedResponse.model_id))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        showNotification({
          title: "Error",
          description: "Failed to fetch AI configurations",
          type: "error"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dispatch])

  const handleSaveApiKey = async (providerId: string) => {
    const apiKey = apiKeys[providerId]?.trim()
    if (!apiKey) {
      showNotification({ title: "Error", description: "Please enter a valid API key", type: "error" })
      return
    }

    const provider = getProviderById(providerId)
    if (!provider) {
      showNotification({ title: "Error", description: "Invalid AI provider selected", type: "error" })
      return
    }

    if (!validateApiKey(providerId, apiKey)) {
      showNotification({
        title: "Error",
        description: `${provider.name} API key should start with "${provider.keyPrefix}"`,
        type: "error"
      })
      return
    }

    const selectedModel = newModelSelection[providerId] || provider.models[0]
    if (!provider.models.includes(selectedModel)) {
      showNotification({
        title: "Error",
        description: `Invalid model selected for ${provider.name}`,
        type: "error"
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await connect.createUserAiModal({
        model_id: providerId,
        name: provider.name,
        api_key: apiKey,
        model: selectedModel
      })

      if (response.success === false && response.error) {
        showNotification({
          title: "Error",
          description: response.error,
          type: "error"
        })
        return
      }

      if (!("id" in response) || !response.id) {
        showNotification({
          title: "Error",
          description: "Failed to save configuration: missing model id",
          type: "error"
        })
        return
      }

      // Update local state
      setAiModels((prev) => [
        ...prev.filter((m) => m.model_id !== providerId),
        { id: response.id, model_id: providerId, name: provider.name, api_key: apiKey, model: selectedModel }
      ])
      
      // Update Redux
      dispatch(setAIConfig({
        providerId,
        apiKey,
        model: selectedModel
      }))

      showNotification({
        title: "Success",
        description: `${provider.name} configuration saved!`,
        type: "success"
      })
    } catch (error) {
      console.error("Error saving AI model:", error)
      showNotification({
        title: "Error",
        description: "Failed to save configuration",
        type: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearApiKey = async (providerId: string) => {
    const model = aiModels.find((m) => m.model_id === providerId)
    if (!model?.id) {
      showNotification({
        title: "Error",
        description: "Failed to find AI model",
        type: "error"
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await connect.deleteUserAiModal(model.id)
      if (!response || !response.success) {
        showNotification({
          title: "Error",
          description: "Failed to clear configuration",
          type: "error"
        })
        return
      }

      // Update local state
      setAiModels((prev) => prev.filter((m) => m.model_id !== providerId))
      setApiKeys((prev) => ({ ...prev, [providerId]: "" }))
      dispatch(removeAIConfig(providerId))

      // If this was the selected model, clear selection
      if (selectedModelId === providerId) {
        setSelectedModelId(null)
        dispatch(setSelectedProvider(""))
      }

      showNotification({
        title: "Success",
        description: `${getProviderById(providerId)?.name} configuration cleared!`,
        type: "success"
      })
    } catch (error) {
      console.error("Error clearing configuration:", error)
      showNotification({
        title: "Error",
        description: "Failed to clear configuration",
        type: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderSelect = async (providerId: string) => {
    try {
      setIsLoading(true)
      const response = await connect.setSelectedAiModel({ model_id: providerId })
      if (!response || !response.id) {
        showNotification({
          title: "Error",
          description: "Failed to set selected AI model",
          type: "error"
        })
        return
      }

      setSelectedModelId(providerId)
      dispatch(setSelectedProvider(providerId))
      showNotification({
        title: "Success",
        description: `Switched to ${getProviderById(providerId)?.name}`,
        type: "info"
      })
    } catch (error) {
      console.error("Error setting selected model:", error)
      showNotification({
        title: "Error",
        description: "Failed to set selected AI model",
        type: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }))
  }

  const InteractiveIcon = ({ icon: Icon, className = "" }: { icon: any; className?: string }) => (
    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
      <Icon className={`h-5 w-5 ${className}`} />
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-transparent relative">
      <AnimatedBackground />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Settings</h1>
          <p className="text-gray-400">Configure your AI providers and models</p>
        </motion.div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="providers" className="data-[state=active]:bg-white/20">
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="general" className="data-[state=active]:bg-white/20">
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <InteractiveIcon icon={Bot} />
                    Active Provider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Loader size={20} color="#ffffffff" speed={2} />
                  ) : (
                    <Select value={selectedModelId || ""} onValueChange={handleProviderSelect}>
                      <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-white/30">
                        <SelectValue placeholder="Select AI Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiModels.map((model) => (
                          <SelectItem key={model.id} value={model.model_id}>
                            <div className="flex items-center gap-2">
                              <span>{model.name}</span>
                              <span className="text-xs text-gray-500">{model.model}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid gap-6">
              {AI_PROVIDERS.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <InteractiveIcon icon={Key} />
                          {provider.name}
                        </div>
                        {aiConfigs[provider.id] && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                              className="w-2 h-2 bg-green-400 rounded-full"
                            />
                            Configured
                          </motion.div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`${provider.id}-key`} className="text-gray-300">
                          API Key
                        </Label>
                        <div className="relative">
                          <Input
                            id={`${provider.id}-key`}
                            type={showApiKeys[provider.id] ? "text" : "password"}
                            value={apiKeys[provider.id] || ""}
                            onChange={(e) => setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                            placeholder={`${provider.keyPrefix}...`}
                            className="pr-12 bg-white/50 dark:bg-gray-800/50 border-white/30"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={() => toggleApiKeyVisibility(provider.id)}
                          >
                            {showApiKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </motion.button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`${provider.id}-model`} className="text-gray-300">
                          Model
                        </Label>
                        <Select
                          value={newModelSelection[provider.id] || provider.models[0]}
                          onValueChange={(value) => {
                            setNewModelSelection((prev) => ({ ...prev, [provider.id]: value }))
                          }}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-white/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {provider.models.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                          <Button
                            onClick={() => handleSaveApiKey(provider.id)}
                            className="w-full bg-white text-black hover:bg-gray-200 shadow-lg"
                            disabled={isLoading}
                          >
                            <InteractiveIcon icon={Plus} className="mr-2" />
                            Save Configuration
                          </Button>
                        </motion.div>
                        {aiConfigs[provider.id] && (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              onClick={() => handleClearApiKey(provider.id)}
                              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-lg"
                              disabled={isLoading}
                            >
                              <InteractiveIcon icon={Trash2} />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="general">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <InteractiveIcon icon={Shield} />
                    Privacy & Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-300">
                    {[
                      { icon: Database, text: "Your API keys are stored securely in our database", color: "green" },
                      { icon: Shield, text: "We implement strict security measures to protect your data", color: "blue" },
                      {
                        icon: Zap,
                        text: "Chat messages are processed directly with your chosen AI provider",
                        color: "purple"
                      },
                      { icon: Trash2, text: "You can clear your data anytime", color: "gray" }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                      >
                        <InteractiveIcon icon={item.icon} className={`text-${item.color}-400`} />
                        <span>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  )
}