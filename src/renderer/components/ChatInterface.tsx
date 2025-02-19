import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Message, ChatChunk } from '../types'

interface ChatInterfaceProps {
  modelName: string
}

interface CodeProps {
  node?: any
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

export function ChatInterface({ modelName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const accumulatedContentRef = useRef('')

  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [input])

  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Cleanup streaming subscription on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setStreamingContent('')
    accumulatedContentRef.current = ''

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Add user message to chat
    const userMessageObj: Message = { role: 'user', content: userMessage }
    const newMessages = [...messages, userMessageObj]
    setMessages(newMessages)

    try {
      // Clean up previous subscription if exists
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }

      // Set up streaming handler
      cleanupRef.current = window.api.onChatChunk((data: ChatChunk) => {
        if (data.message?.content) {
          accumulatedContentRef.current += data.message.content
          setStreamingContent(accumulatedContentRef.current)
        }
        if (data.done) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: accumulatedContentRef.current }
          ])
          setStreamingContent('')
          setLoading(false)
        }
      })

      // Start streaming chat
      await window.api.chat(modelName, newMessages, true)
    } catch (error) {
      console.error('Chat error:', error)
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setMessages([...newMessages, errorMessage])
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        pre: ({ children }) => (
          <pre className="bg-gray-800 dark:bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-2 shadow-sm">
            {children}
          </pre>
        ),
        code: ({ inline, className, children, ...props }: CodeProps) => {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''
          if (inline) {
            return (
              <code className="bg-gray-200 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                {children}
              </code>
            )
          }
          return (
            <div className="relative group">
              {language && (
                <div className="absolute right-2 top-2 px-2 py-1 text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-900/50 dark:bg-gray-800/50 rounded">
                  {language}
                </div>
              )}
              <code className={`${className} block text-sm`} {...props}>
                {children}
              </code>
            </div>
          )
        },
        p: ({ children }) => (
          <p className="mb-4 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 last:mb-0 space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 last:mb-0 space-y-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-bold mb-2">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">
            {children}
          </blockquote>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  )

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border dark:border-gray-700 rounded-lg">
        {messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Start a conversation with {modelName}
          </p>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <div className={`prose ${
                    message.role === 'user'
                      ? 'prose-invert'
                      : 'prose-gray dark:prose-invert'
                  } max-w-none`}>
                    {renderMarkdown(message.content)}
                  </div>
                </div>
              </div>
            ))}
            {/* Streaming content */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700">
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {renderMarkdown(streamingContent)}
                  </div>
                </div>
              </div>
            )}
            {/* Loading indicator */}
            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                  <p className="text-gray-900 dark:text-white">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex space-x-4">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift + Enter for new line)"
            className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[42px] max-h-[200px]"
            disabled={loading}
            rows={1}
          />
          <div className="absolute right-2 bottom-2 text-xs text-gray-400">
            Press Enter to send
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Send
        </button>
      </form>
    </div>
  )
}
