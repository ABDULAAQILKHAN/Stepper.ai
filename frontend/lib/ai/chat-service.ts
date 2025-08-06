interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface StreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

export class ChatService {
  // OpenAI streaming with optional custom URL (for Groq reuse)
  private async streamOpenAI(
    messages: ChatMessage[],
    apiKey: string,
    model = "gpt-4o-mini",
    onChunk: (chunk: StreamResponse) => void,
    baseUrl = "https://api.openai.com/v1/chat/completions"
  ) {
    try {
      const response = await fetch(baseUrl, {
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
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onChunk({ content: "", isComplete: true });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                onChunk({ content, isComplete: false });
              }
            } catch {
              // ignore invalid JSON
            }
          }
        }
      }
    } catch (error) {
      onChunk({
        content: "",
        isComplete: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Anthropic streaming
  private async streamAnthropic(
    messages: ChatMessage[],
    apiKey: string,
    model = "claude-3-5-sonnet-20241022",
    onChunk: (chunk: StreamResponse) => void
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
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta") {
                const content = parsed.delta?.text || "";
                if (content) {
                  onChunk({ content, isComplete: false });
                }
              } else if (parsed.type === "message_stop") {
                onChunk({ content: "", isComplete: true });
                return;
              }
            } catch {
              // ignore invalid JSON
            }
          }
        }
      }
    } catch (error) {
      onChunk({
        content: "",
        isComplete: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Perplexity streaming (example based on OpenAI-style streaming)
  private async streamPerplexity(
    messages: ChatMessage[],
    apiKey: string,
    model = "sonar-mini",
    onChunk: (chunk: StreamResponse) => void
  ) {
    try {
      const response = await fetch("https://api.perplexity.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) throw new Error(`Perplexity API error: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onChunk({ content: "", isComplete: true });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) onChunk({ content, isComplete: false });
            } catch {}
          }
        }
      }
    } catch (error) {
      onChunk({
        content: "",
        isComplete: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Google Gemini streaming (example, adapt to official API if needed)
  private async streamGemini(
    messages: ChatMessage[],
    apiKey: string,
    model = "gemini-1.5-pro",
    onChunk: (chunk: StreamResponse) => void
  ) {
    try {
      // Example URL, you need to confirm with Google Gemini API docs
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            messages,
          },
          temperature: 0.7,
          maxTokens: 2000,
          // Enable streaming if supported
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`Google AI API error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // This SDK might send multiple JSON objects per chunk separated by newlines.
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            // Response structure example: { candidates: [{ content: string }] }
            const content = parsed.candidates?.[0]?.content || "";
            if (content) {
              onChunk({ content, isComplete: false });
            }
            // If Gemini signals completion differently, handle here
          } catch {
            // ignore invalid JSON
          }
        }
      }
      onChunk({ content: "", isComplete: true });
    } catch (error) {
      onChunk({
        content: "",
        isComplete: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Groq streaming - Groq API is OpenAI-compatible, reuse streamOpenAI with custom base URL
  private async streamGroq(
    messages: ChatMessage[],
    apiKey: string,
    model = "llama-3.1-70b-versatile",
    onChunk: (chunk: StreamResponse) => void
  ) {
    const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    return this.streamOpenAI(messages, apiKey, model, onChunk, groqUrl);
  }

  // Cohere streaming (example using SSE style)
  private async streamCohere(
    messages: ChatMessage[],
    apiKey: string,
    model = "command-r-plus",
    onChunk: (chunk: StreamResponse) => void
  ) {
    try {
      const response = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error(`Cohere API error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          // Cohere may send SSE formatted lines starting with "data: "
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onChunk({ content: "", isComplete: true });
              return;
            }
            try {
              // Cohere response format may differ – adapt if known
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || parsed.text || "";
              if (content) onChunk({ content, isComplete: false });
            } catch {
              // ignore invalid JSON
            }
          }
        }
      }
      onChunk({ content: "", isComplete: true });
    } catch (error) {
      onChunk({
        content: "",
        isComplete: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Main streamChat dispatcher
  async streamChat(
    messages: ChatMessage[],
    providerId: string,
    apiKey: string,
    model: string,
    onChunk: (chunk: StreamResponse) => void
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
    };

    const allMessages = [systemMessage, ...messages];

    switch (providerId) {
      case "openai":
        return this.streamOpenAI(allMessages, apiKey, model, onChunk);
      case "anthropic":
        return this.streamAnthropic(allMessages, apiKey, model, onChunk);
      case "perplexity":
        return this.streamPerplexity(allMessages, apiKey, model, onChunk);
      case "google":
        return this.streamGemini(allMessages, apiKey, model, onChunk);
      case "groq":
        return this.streamGroq(allMessages, apiKey, model, onChunk);
      case "cohere":
        return this.streamCohere(allMessages, apiKey, model, onChunk);
      default:
        onChunk({
          content: "",
          isComplete: true,
          error: `Provider ${providerId} not yet supported for streaming`,
        });
    }
  }
}

export const chatService = new ChatService();
