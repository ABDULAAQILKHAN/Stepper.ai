interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface StreamResponse {
  content: string
  isComplete: boolean
  error?: string
}

export class ChatService {
  private async streamOpenAI(
    messages: ChatMessage[],
    apiKey: string,
    model = "gpt-4o-mini",
    onChunk: (chunk: StreamResponse) => void,
  ) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              onChunk({ content: "", isComplete: true })
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ""
              if (content) {
                onChunk({ content, isComplete: false })
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      onChunk({
        content: "",
        isComplete: true,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  private async streamAnthropic(
    messages: ChatMessage[],
    apiKey: string,
    model = "claude-3-5-sonnet-20241022",
    onChunk: (chunk: StreamResponse) => void,
  ) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: messages.filter((m) => m.role !== "system"),
          system: messages.find((m) => m.role === "system")?.content,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "content_block_delta") {
                const content = parsed.delta?.text || ""
                if (content) {
                  onChunk({ content, isComplete: false })
                }
              } else if (parsed.type === "message_stop") {
                onChunk({ content: "", isComplete: true })
                return
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      onChunk({
        content: "",
        isComplete: true,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  async streamChat(
    messages: ChatMessage[],
    providerId: string,
    apiKey: string,
    model: string,
    onChunk: (chunk: StreamResponse) => void,
  ) {
    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are Stepper.ai, an AI debugging assistant. Help users debug their code step by step. 

Guidelines:
1. Break down complex problems into clear, numbered steps
2. Provide specific, actionable solutions
3. Explain your reasoning for each step
4. Ask clarifying questions when needed
5. Use code examples when helpful
6. Be encouraging and supportive

Format your responses with clear structure and use markdown for code blocks.`,
    }

    const allMessages = [systemMessage, ...messages]

    switch (providerId) {
      case "openai":
        return this.streamOpenAI(allMessages, apiKey, model, onChunk)
      case "anthropic":
        return this.streamAnthropic(allMessages, apiKey, model, onChunk)
      default:
        onChunk({
          content: "",
          isComplete: true,
          error: `Provider ${providerId} not yet supported for streaming`,
        })
    }
  }
}

export const chatService = new ChatService()
