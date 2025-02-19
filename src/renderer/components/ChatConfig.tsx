import React, { useState } from 'react'
import { OllamaModel } from '../types'
import { ModelCard } from './ModelCard'
import { ResponseModeCard } from './ResponseModeCard'

interface ChatConfigProps {
  models: OllamaModel[]
  selectedModel: string
  onModelChange: (model: string) => void
  responseMode: 'concise' | 'normal' | 'longform'
  onResponseModeChange: (mode: 'concise' | 'normal' | 'longform') => void
}

const ResponseModeDescriptions = {
  concise: 'Brief, direct answers focusing on key points',
  normal: 'Balanced responses with explanations and examples',
  longform: 'Detailed analysis with comprehensive context'
}

export function ChatConfig({
  models, 
  selectedModel, 
  onModelChange,
  responseMode,
  onResponseModeChange
}: ChatConfigProps) {
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showResponseModePicker, setShowResponseModePicker] = useState(false)
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

        {/* Response mode selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Response Style
          </label>
          <button
            onClick={() => setShowResponseModePicker(!showResponseModePicker)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="capitalize">{responseMode}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${showResponseModePicker ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Response mode picker dropdown */}
          {showResponseModePicker && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowResponseModePicker(false)}
              />
              <div className="absolute z-20 mt-1 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
                <div className="p-2 grid gap-2">
                  {(['concise', 'normal', 'longform'] as const).map(mode => (
                    <ResponseModeCard
                      key={mode}
                      mode={mode}
                      selected={mode === responseMode}
                      onClick={() => {
                        onResponseModeChange(mode)
                        setShowResponseModePicker(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
