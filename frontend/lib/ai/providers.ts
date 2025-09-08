export interface AIProvider {
  id: string
  name: string
  models: string[]
  keyPrefix: string
  baseUrl?: string
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "perplexity",
    name: "Perplexity AI",
    models: ["sonar-pro-70b-v2.5", "sonar-mini-32b-v2.5", "sonar-pro", "sonar-mini", "sonar-reasoning", "sonar-deep-research"],
    keyPrefix: "pplx",
  },
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-5o", "gpt-5o-mini", "gpt-4.5-turbo", "gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt-3.5-turbo-instruct", "text-davinci-003"],
    keyPrefix: "sk-",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-4.1-opus", "claude-4-sonnet", "claude-3.7-sonnet", "claude-3.5-sonnet-v2", "claude-3.5-haiku", "claude-3-opus", "claude-3-sonnet", "claude-3-haiku", "claude-2.1", "claude-2", "claude-instant-1.2"],
    keyPrefix: "sk-ant-",
  },
  {
    id: "google",
    name: "Google AI",
    models: ["gemini-2.5-pro-diamond", "gemini-2.5-flash-spark", "gemini-2.5-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro", "gemini-1.0-pro-vision", "gemma-3-7b", "gemma-3-2b", "gemma-2-9b", "gemma-2-2b", "medlm-medium", "medlm-large", "imagen-4", "veo-3"],
    keyPrefix: "AI",
  },
  {
    id: "groq",
    name: "Groq",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama-4-scout", "llama-4-maverick", "llama-guard-4-12b", "kimi-k2", "gpt-oss-120b", "gpt-oss-20b", "qwen/qwen3-32b", "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768", "llama-3-70b-8k", "llama-3-8b-8k"],
    keyPrefix: "gsk_",
  },
  {
    id: "cohere",
    name: "Cohere",
    models: ["command-a", "command-r-plus", "command-r", "command-r-plus-2", "command-52b", "command-light", "embed-4", "rerank-3.5"],
    keyPrefix: "co-",
  },
];

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id)
}

export function validateApiKey(providerId: string, apiKey: string): boolean {
  const provider = getProviderById(providerId)
  if (!provider) return false
  return apiKey.startsWith(provider.keyPrefix)
}
