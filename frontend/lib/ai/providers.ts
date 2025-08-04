export interface AIProvider {
  id: string
  name: string
  models: string[]
  keyPrefix: string
  baseUrl?: string
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    keyPrefix: "sk-",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    keyPrefix: "sk-ant-",
  },
  {
    id: "google",
    name: "Google AI",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"],
    keyPrefix: "AI",
  },
  {
    id: "groq",
    name: "Groq",
    models: ["llama-3.1-70b-versatile", "mixtral-8x7b-32768"],
    keyPrefix: "gsk_",
  },
  {
    id: "cohere",
    name: "Cohere",
    models: ["command-r-plus", "command-r"],
    keyPrefix: "co-",
  },
]

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id)
}

export function validateApiKey(providerId: string, apiKey: string): boolean {
  const provider = getProviderById(providerId)
  if (!provider) return false
  return apiKey.startsWith(provider.keyPrefix)
}
