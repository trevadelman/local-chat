import { useState, useEffect } from 'react'

interface OllamaStatusProps {
  isOpen: boolean
  onClose: () => void
}

export function OllamaStatus({ isOpen, onClose }: OllamaStatusProps) {
  const [ollamaVersion, setOllamaVersion] = useState<string | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPulling, setPulling] = useState(false)
  const [pullProgress, setPullProgress] = useState('')
  const [customModel, setCustomModel] = useState('')

  const recommendedModels = [
    { name: 'llama3.2-vision', description: 'Vision capabilities for image analysis and understanding' },
    { name: 'llama3.1:8b', description: 'Excellent for chat and programming tasks' },
    { name: 'deepseek-r1:1.5b', description: 'Fast, lightweight model with step-by-step reasoning' }
  ]

  useEffect(() => {
    checkOllamaStatus()
  }, [isOpen])

  const checkOllamaStatus = async () => {
    setIsChecking(true)
    setError(null)
    try {
      const version = await window.api.getOllamaVersion()
      setOllamaVersion(version)
      setIsInstalled(true)
    } catch (err) {
      setIsInstalled(false)
      setError('Ollama not found or not running')
    } finally {
      setIsChecking(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-xl w-full mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white">Ollama Status</h2>
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

        <div className="p-6 space-y-6">
          {isChecking ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-300">Status:</span>
                  <span className="text-white">{isInstalled ? 'Installed and Running' : 'Not Installed'}</span>
                </div>
                {ollamaVersion && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300">Version:</span>
                    <span className="text-white">{ollamaVersion}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 text-red-300 p-3 rounded-lg border border-red-700/50">
                  {error}
                </div>
              )}

              {!isInstalled && (
                <div className="space-y-4">
                  <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700/50">
                    <h3 className="font-medium text-yellow-200">Installation Required</h3>
                    <p className="mt-2 text-sm text-yellow-300">
                      Ollama needs to be installed to use Local Chat. Visit the official website to download:
                    </p>
                  </div>
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    Download Ollama
                  </a>
                </div>
              )}

              {isInstalled && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {/* Custom Model Input */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-300">Pull Custom Model</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., llama3.2:3b"
                          className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500"
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                        />
                        <button
                          onClick={async () => {
                            if (!customModel.trim()) return
                            setPulling(true)
                            setPullProgress(`Pulling ${customModel}...`)
                            try {
                              await window.api.pullModel(customModel)
                              setPullProgress(`Successfully pulled ${customModel}`)
                              setCustomModel('')
                            } catch (err) {
                              setPullProgress(`Failed to pull ${customModel}`)
                              console.error(err)
                            } finally {
                              setPulling(false)
                            }
                          }}
                          disabled={isPulling || !customModel.trim()}
                          className="w-32 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Pull
                        </button>
                      </div>
                    </div>

                    {/* Recommended Models */}
                    <div>
                      <h3 className="font-medium text-gray-300">Recommended Models</h3>
                      <div className="grid gap-3">
                        {recommendedModels.map(model => (
                          <div key={model.name} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="font-medium text-white truncate">{model.name}</div>
                              <div className="text-sm text-gray-400 truncate">{model.description}</div>
                            </div>
                            <button
                              onClick={async () => {
                                setPulling(true)
                                setPullProgress(`Pulling ${model.name}...`)
                                try {
                                  await window.api.pullModel(model.name)
                                  setPullProgress(`Successfully pulled ${model.name}`)
                                } catch (err) {
                                  setPullProgress(`Failed to pull ${model.name}`)
                                  console.error(err)
                                } finally {
                                  setPulling(false)
                                }
                              }}
                              disabled={isPulling}
                              className="w-32 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              Pull Model
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {pullProgress && (
                      <div className="p-3 bg-blue-900/30 text-blue-300 rounded-lg border border-blue-700/50">
                        <div className="flex items-center gap-3">
                          {isPulling && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                          )}
                          <span>{pullProgress}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={checkOllamaStatus}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mt-4"
                    >
                      Check Status Again
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
