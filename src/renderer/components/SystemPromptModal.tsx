import { useState, useEffect } from 'react'
import { OllamaMessage } from '../types'

interface SystemPromptModalProps {
  isOpen: boolean
  onClose: () => void
  currentPrompt: string
  onSave: (prompt: string) => void
  selectedModel?: string
}

export function SystemPromptModal({ isOpen, onClose, currentPrompt, onSave, selectedModel }: SystemPromptModalProps) {
  const [prompt, setPrompt] = useState(currentPrompt)
  const [isDirty, setIsDirty] = useState(false)
  const [tokenCount, setTokenCount] = useState(0)
  const [isCountingTokens, setIsCountingTokens] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPrompt(currentPrompt)
      setIsDirty(false)
      countTokens(currentPrompt)
    }
  }, [isOpen, currentPrompt])

  const countTokens = async (text: string) => {
    if (!selectedModel || !text.trim()) {
      setTokenCount(0)
      return
    }

    setIsCountingTokens(true)
    try {
      // Create a message array with just the system prompt
      const messages: OllamaMessage[] = [
        {
          role: 'system',
          content: text
        }
      ]

      // Use the chat API to get token count
      const response = await window.api.chat(selectedModel, messages, false)
      if (response.prompt_eval_count) {
        setTokenCount(response.prompt_eval_count)
      }
    } catch (error) {
      console.error('Error counting tokens:', error)
    } finally {
      setIsCountingTokens(false)
    }
  }

  const handleSave = () => {
    if (prompt.trim()) {
      onSave(prompt.trim())
      onClose()
    }
  }

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt)
    setIsDirty(true)
    
    // Debounce token counting to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      countTokens(newPrompt)
    }, 500)
    
    return () => clearTimeout(debounceTimer)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white">System Prompt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Prompt */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Custom System Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              className="w-full h-40 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter your custom system prompt..."
            />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {isCountingTokens ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Counting tokens...
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">{tokenCount}</span> tokens used in system prompt
                  </span>
                )}
              </span>
              {isDirty && (
                <span className="text-yellow-500">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!prompt.trim() || !isDirty}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
