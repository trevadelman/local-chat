import { useState } from 'react'
import { OllamaModel } from '../types'
import { ModelCard } from './ModelCard'
import { OllamaStatus } from './OllamaStatus'
import { SystemPromptModal } from './SystemPromptModal'

interface ChatConfigProps {
  models: OllamaModel[]
  selectedModel: string
  onModelChange: (model: string) => void
  systemPrompt: string
  onSystemPromptChange: (prompt: string) => void
}

export function ChatConfig({
  models, 
  selectedModel, 
  onModelChange,
  systemPrompt,
  onSystemPromptChange
}: ChatConfigProps) {
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [showOllamaStatus, setShowOllamaStatus] = useState(false)

  return (
    <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
      <div className="flex items-center gap-4 relative">
        {/* Model selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model
          </label>
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>{selectedModel}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${showModelPicker ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Model picker dropdown */}
          {showModelPicker && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowModelPicker(false)}
              />
              <div className="absolute z-20 mt-1 w-[400px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
                <div className="p-2 grid gap-2">
                  {models.map(model => (
                    <ModelCard
                      key={model.name}
                      model={model}
                      selected={model.name === selectedModel}
                      onClick={() => {
                        onModelChange(model.name)
                        setShowModelPicker(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* System Prompt Button */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            System Prompt
          </label>
          <button
            onClick={() => setShowSystemPrompt(true)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>Edit Prompt</span>
          </button>
        </div>
      </div>

      {/* Ollama Status Button */}
      <button
        onClick={() => setShowOllamaStatus(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Ollama Status</span>
      </button>

      {/* Modals */}
      <OllamaStatus
        isOpen={showOllamaStatus}
        onClose={() => setShowOllamaStatus(false)}
      />
      <SystemPromptModal
        isOpen={showSystemPrompt}
        onClose={() => setShowSystemPrompt(false)}
        currentPrompt={systemPrompt}
        onSave={onSystemPromptChange}
      />
    </div>
  )
}
