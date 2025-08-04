"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Copy, Check } from "lucide-react"

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
}

export default function CodeBlock({ children, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  // Simple syntax highlighting for common languages
  const highlightCode = (code: string, lang?: string) => {
    if (!lang) return code

    // Basic highlighting patterns
    const patterns = {
      javascript: [
        {
          pattern: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g,
          className: "text-purple-400",
        },
        { pattern: /\b(true|false|null|undefined)\b/g, className: "text-orange-400" },
        { pattern: /"([^"\\]|\\.)*"/g, className: "text-green-400" },
        { pattern: /'([^'\\]|\\.)*'/g, className: "text-green-400" },
        { pattern: /`([^`\\]|\\.)*`/g, className: "text-green-400" },
        { pattern: /\/\/.*$/gm, className: "text-gray-500 italic" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "text-gray-500 italic" },
      ],
      typescript: [
        {
          pattern:
            /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|interface|type|enum)\b/g,
          className: "text-purple-400",
        },
        { pattern: /\b(string|number|boolean|object|any|void|never)\b/g, className: "text-blue-400" },
        { pattern: /\b(true|false|null|undefined)\b/g, className: "text-orange-400" },
        { pattern: /"([^"\\]|\\.)*"/g, className: "text-green-400" },
        { pattern: /'([^'\\]|\\.)*'/g, className: "text-green-400" },
        { pattern: /`([^`\\]|\\.)*`/g, className: "text-green-400" },
        { pattern: /\/\/.*$/gm, className: "text-gray-500 italic" },
      ],
      python: [
        {
          pattern: /\b(def|class|if|elif|else|for|while|import|from|return|try|except|with|as|pass|break|continue)\b/g,
          className: "text-purple-400",
        },
        { pattern: /\b(True|False|None)\b/g, className: "text-orange-400" },
        { pattern: /"([^"\\]|\\.)*"/g, className: "text-green-400" },
        { pattern: /'([^'\\]|\\.)*'/g, className: "text-green-400" },
        { pattern: /#.*$/gm, className: "text-gray-500 italic" },
      ],
      css: [
        { pattern: /([a-zA-Z-]+)(?=\s*:)/g, className: "text-blue-400" },
        { pattern: /:\s*([^;]+)/g, className: "text-green-400" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "text-gray-500 italic" },
      ],
      html: [
        { pattern: /<\/?[a-zA-Z][^>]*>/g, className: "text-blue-400" },
        { pattern: /\s([a-zA-Z-]+)=/g, className: "text-purple-400" },
        { pattern: /"([^"]*)"/g, className: "text-green-400" },
        { pattern: /<!--[\s\S]*?-->/g, className: "text-gray-500 italic" },
      ],
    }

    const langPatterns = patterns[lang as keyof typeof patterns] || []

    // Split code into lines for processing
    const lines = code.split("\n")

    return lines.map((line, lineIndex) => {
      let highlightedLine = line

      // Apply syntax highlighting patterns
      langPatterns.forEach(({ pattern, className }) => {
        highlightedLine = highlightedLine.replace(pattern, (match) => {
          return `<span class="${className}">${match}</span>`
        })
      })

      return (
        <div key={lineIndex} className="table-row">
          <div className="table-cell text-gray-500 text-right pr-4 select-none w-8 text-sm">{lineIndex + 1}</div>
          <div className="table-cell" dangerouslySetInnerHTML={{ __html: highlightedLine || " " }} />
        </div>
      )
    })
  }

  return (
    <div className="relative group">
      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm text-gray-400 font-mono">{language || "code"}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copyToClipboard}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
          </motion.button>
        </div>

        {/* Code content */}
        <div className="p-4 overflow-x-auto">
          <div className="table text-sm font-mono text-gray-100 min-w-full">{highlightCode(children, language)}</div>
        </div>
      </div>
    </div>
  )
}
