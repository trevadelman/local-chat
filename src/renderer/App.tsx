import React, { useEffect, useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { ConversationSidebar } from './components/ConversationSidebar'
import { OllamaModel, Conversation } from './types'

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

function App() {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    // Load models when component mounts
    loadModels()

    // Set up error listener
    window.api.onError((error) => {
      setError(error.message || 'An error occurred')
      setLoading(false)
    })
  }, [])

  const loadModels = async () => {
    try {
      setLoading(true)
      setError(null)
      const modelList = await window.api.listModels()
      setModels(modelList)
    } catch (err) {
      setError('Failed to load models. Is Ollama running?')
      console.error('Error loading models:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setSelectedModel(conversation.model_name)
  }

  const handleNewChat = () => {
    setCurrentConversation(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <header className="p-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Local Chat
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Chat with your local Ollama models
          </p>
        </header>

        <main className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex">
            <ConversationSidebar
              onSelectConversation={handleSelectConversation}
              currentConversation={currentConversation}
              onNewChat={handleNewChat}
            />
            
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Available Models
                  </h2>
                  <button
                    onClick={loadModels}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh Models
                  </button>
                </div>
                
                {error ? (
                  <div className="border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                  </div>
                ) : loading ? (
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      Loading available models...
                    </p>
                  </div>
                ) : models.length === 0 ? (
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      No models found. Please install some models through Ollama.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {models.map((model) => (
                      <div
                        key={model.digest}
                        className={`border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                          selectedModel === model.name ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedModel(model.name)}
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {model.name}
                        </h3>
                        <div className="mt-1 space-y-1">
                          {model.details.parameter_size && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Parameters: {model.details.parameter_size}
                            </p>
                          )}
                          {model.details.quantization_level && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Quantization: {model.details.quantization_level}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Size: {formatBytes(model.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat interface */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Chat
                  </h2>
                  {selectedModel ? (
                    <ChatInterface 
                      modelName={selectedModel}
                      currentConversation={currentConversation}
                      onConversationCreated={setCurrentConversation}
                    />
                  ) : (
                    <div className="border dark:border-gray-700 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                      <p className="text-gray-600 dark:text-gray-300">
                        Select a model to start chatting
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
