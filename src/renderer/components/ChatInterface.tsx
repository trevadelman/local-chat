import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Message, ChatChunk, Conversation, OllamaMessage, OllamaModel } from '../types'
import { TokenCounter } from './TokenCounter'
import { ChatConfig } from './ChatConfig'

interface ChatInterfaceProps {
  currentConversation: Conversation | null
  onConversationCreated: (conversation: Conversation) => void
}

interface CodeProps {
  node?: unknown
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

interface ProcessedContent {
  reasoning: string | null
  response: string
}

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.'

function processContent(content: string): ProcessedContent {
  const thinkMatch = content.match(/<think>(.*?)<\/think>/s)
  if (thinkMatch) {
    const reasoning = thinkMatch[1].trim()
    const response = content.replace(/<think>.*?<\/think>/s, '').trim()
    return { reasoning, response }
  }
  return { reasoning: null, response: content.trim() }
}

export function ChatInterface({ currentConversation, onConversationCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [expandedReasonings, setExpandedReasonings] = useState<Set<string>>(new Set())
  const [promptTokens, setPromptTokens] = useState(0)
  const [responseTokens, setResponseTokens] = useState(0)
  const [maxContext, setMaxContext] = useState(4096) // Default, will be updated from model info
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const accumulatedContentRef = useRef('')

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelList = await window.api.listModels()
        setModels(modelList)
        if (modelList.length > 0) {
          const llamaModel = modelList.find(m => m.name === 'llama3:latest')
          if (llamaModel) {
            setSelectedModel(llamaModel.name)
            if (llamaModel.details?.parameter_size) {
              const sizeInB = parseInt(llamaModel.details.parameter_size.replace('B', ''))
              const contextLength = sizeInB <= 7 ? 4096 : 8192
              setMaxContext(contextLength)
            }
          } else {
            // Fallback to first model if llama not found
            setSelectedModel(modelList[0].name)
            if (modelList[0].details?.parameter_size) {
              const sizeInB = parseInt(modelList[0].details.parameter_size.replace('B', ''))
              const contextLength = sizeInB <= 7 ? 4096 : 8192
              setMaxContext(contextLength)
            }
          }
        }
      } catch (error) {
        console.error('Error loading models:', error)
      }
    }

    loadModels()
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id)
      // Load system prompt from conversation
      if (currentConversation.system_prompt) {
        setSystemPrompt(currentConversation.system_prompt)
      } else {
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
      }
    } else {
      setMessages([])
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
    }
  }, [currentConversation])

  // Update context length when model changes
  useEffect(() => {
    const fetchModelInfo = async () => {
      if (!selectedModel) return;
      
      try {
        const modelInfo = await window.api.showModel(selectedModel);
        console.log('Model info:', modelInfo);
        
        // Check for context length in model_info based on architecture
        if (modelInfo.model_info) {
          // Get the architecture from the model info
          const architecture = modelInfo.model_info["general.architecture"];
          
          // Look for context length based on architecture
          let contextLength = null;
          if (architecture) {
            contextLength = modelInfo.model_info[`${architecture}.context_length`];
          }
          
          // If we found a context length, use it
          if (contextLength) {
            console.log(`Found context length for ${architecture}: ${contextLength}`);
            setMaxContext(Number(contextLength));
            return;
          }
          
          // Fallback to llama.context_length for backward compatibility
          if (modelInfo.model_info["llama.context_length"]) {
            console.log(`Using llama.context_length: ${modelInfo.model_info["llama.context_length"]}`);
            setMaxContext(Number(modelInfo.model_info["llama.context_length"]));
            return;
          }
        }
        
        // Fallback to estimation based on parameter size
        if (modelInfo.details?.parameter_size) {
          const sizeInB = parseInt(modelInfo.details.parameter_size.replace('B', ''));
          const contextLength = sizeInB <= 7 ? 4096 : 8192;
          console.log(`Estimating context length based on parameter size: ${contextLength}`);
          setMaxContext(contextLength);
        }
      } catch (error) {
        console.error('Error fetching model info:', error);
        // Fallback to the old method if the show API fails
        const model = models.find(m => m.name === selectedModel);
        if (model?.details?.parameter_size) {
          const sizeInB = parseInt(model.details.parameter_size.replace('B', ''));
          const contextLength = sizeInB <= 7 ? 4096 : 8192;
          console.log(`Fallback context length: ${contextLength}`);
          setMaxContext(contextLength);
        }
      }
    };

    fetchModelInfo();
  }, [selectedModel, models]);

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

  const loadMessages = async (conversationId: string) => {
    try {
      const loadedMessages = await window.api.getMessages(conversationId)
      setMessages(loadedMessages)

      // Convert messages to Ollama format for token counting
      const ollamaMessages: OllamaMessage[] = loadedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Get token counts for loaded conversation
      const response = await window.api.chat(selectedModel, ollamaMessages, false)
      if (response.prompt_eval_count) {
        setPromptTokens(response.prompt_eval_count)
      }
      if (response.eval_count) {
        setResponseTokens(response.eval_count)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const toggleReasoning = (messageId: string) => {
    setExpandedReasonings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  // Reset states when conversation changes
  useEffect(() => {
    setExpandedReasonings(new Set())
    if (!currentConversation) {
      setPromptTokens(0)
      setResponseTokens(0)
    }
  }, [currentConversation])

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

    try {
      // Create new conversation if none exists
      let activeConversation = currentConversation
      if (!activeConversation) {
        // First create with temporary title
        const newConversation = await window.api.createConversation(
          'New Chat',
          selectedModel,
          systemPrompt
        )
        activeConversation = newConversation
        onConversationCreated(newConversation)

        // Generate a title using the model
        try {
          const titleResponse = await window.api.chat(
            selectedModel,
            [{
              role: 'system',
              content: 'Create a very brief title (max 5 words) for a conversation that starts with this message. Respond with just the title, no quotes or punctuation.'
            }, {
              role: 'user',
              content: userMessage
            }],
            false
          )

          if (titleResponse.message?.content) {
            // Update conversation with generated title
            const updatedConversation = await window.api.updateConversation(
              newConversation.id,
              titleResponse.message.content.trim(),
              systemPrompt
            )
            onConversationCreated(updatedConversation)
          }
        } catch (error) {
          console.error('Error generating title:', error)
        }
      }

      // Add user message to database and state
      const savedUserMessage = await window.api.addMessage(
        activeConversation.id,
        'user',
        userMessage
      )
      const newMessages = [...messages, savedUserMessage]
      setMessages(newMessages)

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
          // Save assistant's message to database
          window.api.addMessage(
            activeConversation.id,
            'assistant',
            accumulatedContentRef.current
          ).then(savedMessage => {
            setMessages(prev => [...prev, savedMessage])
          })
          setStreamingContent('')
          setLoading(false)
          // Update token counts
          if (data.prompt_eval_count) {
            setPromptTokens(data.prompt_eval_count)
          }
          if (data.eval_count) {
            setResponseTokens(data.eval_count)
          }
        }
      })

      // Get full conversation history
      const conversationHistory = await window.api.getMessages(activeConversation.id)
      
      // Convert full history to Ollama format and add system message
      const ollamaMessages: OllamaMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]

      // Start streaming chat with full history
      await window.api.chat(selectedModel, ollamaMessages, true)
    } catch (error) {
      console.error('Chat error:', error)
      // Add error message to chat
      const errorMessage: Message = {
        id: 'error',
        conversation_id: currentConversation?.id || 'error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const renderMessage = (content: string, messageId: string) => {
    const { reasoning, response } = processContent(content)
    const isExpanded = expandedReasonings.has(messageId)

    return (
      <div className="space-y-2">
        {reasoning && (
          <div className="space-y-2">
                <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-3 mb-3 backdrop-blur-sm border border-gray-200/10">
              <button
                onClick={() => toggleReasoning(messageId)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-semibold">
                  Reasoning
                  <svg 
                    className={`w-3 h-3 inline-block ml-1 transform transition-transform ${!isExpanded ? '-rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {isExpanded && (
                <div className="mt-2 font-mono text-sm text-gray-600 dark:text-gray-400">
                  {reasoning}
                </div>
              )}
            </div>
          </div>
        )}
        {response && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                pre: function PreComponent({ children }) {
                  // Get the code content from the pre element's innerText
                  const preRef = useRef<HTMLPreElement>(null);
                  useEffect(() => {
                    if (preRef.current) {
                      const codeElement = preRef.current.querySelector('code');
                      if (codeElement) {
                        codeElement.setAttribute('data-code', codeElement.innerText);
                      }
                    }
                  }, []);

                  const copyCode = (e: React.MouseEvent<HTMLButtonElement>) => {
                    const button = e.currentTarget;
                    const pre = preRef.current;
                    if (pre) {
                      const code = pre.querySelector('code');
                      const codeContent = code?.getAttribute('data-code') || code?.innerText || '';
                      navigator.clipboard.writeText(codeContent);
                      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
                      button.classList.add('text-green-400');
                      setTimeout(() => {
                        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
                        button.classList.remove('text-green-400');
                      }, 2000);
                    }
                  };

                  return (
                    <div className="relative">
                      <pre ref={preRef} className="bg-gray-800 dark:bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-2 shadow-sm">
                        {children}
                      </pre>
                      <button
                        onClick={copyCode}
                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-700/90 rounded-md opacity-100 hover:bg-gray-600 transition-all shadow-sm"
                        title="Copy code"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                          />
                        </svg>
                      </button>
                    </div>
                  )
                },
                code: ({ inline, className, children, ...props }: CodeProps) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''
                  
                  // Handle inline code
                  if (inline) {
                    return (
                      <code 
                        className="bg-gray-200 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono break-words inline-block" 
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }
                  
                  // Handle code blocks
                  return (
                    <div className="relative group/message">
                      {language && (
                        <div className="absolute right-12 top-2 px-2 py-1 text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-900/50 dark:bg-gray-800/50 rounded">
                          {language}
                        </div>
                      )}
                      <code className={`${className} block text-sm whitespace-pre-wrap`} {...props}>
                        {children}
                      </code>
                    </div>
                  )
                },
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0 leading-relaxed break-words">{children}</p>
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
              {response}
            </ReactMarkdown>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Configuration */}
      <ChatConfig
        models={models}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        systemPrompt={systemPrompt}
        onSystemPromptChange={(newPrompt) => {
          setSystemPrompt(newPrompt)
          // Update system prompt in database if conversation exists
          if (currentConversation) {
            window.api.updateSystemPrompt(currentConversation.id, newPrompt)
              .catch(error => console.error('Error updating system prompt:', error))
          }
        }}
      />

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-8 mb-4 p-6 border dark:border-gray-700/50 rounded-lg backdrop-blur-sm">
        {!selectedModel ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-4xl">💭</div>
            <p className="text-gray-500 dark:text-gray-400">
              Select a model to start chatting
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-4xl">👋</div>
            <p className="text-gray-500 dark:text-gray-400">
              Start a conversation with {selectedModel}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="relative group">
                  {message.role === 'assistant' && (
                    <button
                      onClick={(e) => {
                        const button = e.currentTarget;
                        const content = message.content;
                        navigator.clipboard.writeText(content);
                        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
                        button.classList.add('text-green-400');
                        setTimeout(() => {
                          button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
                          button.classList.remove('text-green-400');
                        }, 2000);
                      }}
                      className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-white bg-gray-700/90 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10 hover:scale-110 hover:bg-gray-600"
                      title="Copy message"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                        />
                      </svg>
                    </button>
                  )}
                  <div
                    className={`max-w-[90%] rounded-lg px-5 py-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700/90 shadow-sm backdrop-blur-sm'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      renderMessage(message.content, message.id)
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Streaming content */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-lg px-5 py-4 bg-gray-100 dark:bg-gray-700/90 shadow-sm backdrop-blur-sm">
                  {renderMessage(streamingContent, 'streaming')}
                </div>
              </div>
            )}
            {/* Loading indicator */}
            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700/90 rounded-lg px-4 py-3 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-gray-900 dark:text-white ml-1">Thinking</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input form */}
      <div className="space-y-2">
        {/* Token counter */}
        {(promptTokens > 0 || responseTokens > 0) && (
          <div className="px-4 mb-2">
            <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-2 backdrop-blur-sm">
              <TokenCounter 
                promptTokens={promptTokens}
                responseTokens={responseTokens}
                maxContext={maxContext}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-4">
          {!selectedModel ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Please select a model to start chatting
            </div>
          ) : (
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift + Enter for new line)"
                className="w-full px-4 py-3 border dark:border-gray-700/50 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[42px] max-h-[200px] backdrop-blur-sm shadow-sm"
                disabled={loading || !selectedModel}
                rows={1}
              />
              <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                Press Enter to send
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim() || !selectedModel}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm transition-colors"
            >
              Send
            </button>
          </div>
          )}
        </form>
      </div>
    </div>
  )
}
