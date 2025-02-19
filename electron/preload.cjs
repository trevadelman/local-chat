const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Ollama API methods
    listModels: () => ipcRenderer.invoke('ollama:list-models'),
    chat: (model, messages, stream = true) => ipcRenderer.invoke('ollama:chat', { model, messages, stream }),
    generateCompletion: (model, prompt) => ipcRenderer.invoke('ollama:generate', { model, prompt }),
    
    // App methods
    isDarkMode: () => ipcRenderer.invoke('app:get-dark-mode'),
    setDarkMode: (dark) => ipcRenderer.invoke('app:set-dark-mode', dark),
    
    // Event handlers
    onModelLoading: (callback) => ipcRenderer.on('model:loading', callback),
    onModelLoaded: (callback) => ipcRenderer.on('model:loaded', callback),
    onError: (callback) => ipcRenderer.on('error', callback),
    onChatChunk: (callback) => {
      const subscription = (_event, data) => callback(data)
      ipcRenderer.on('ollama:chat:chunk', subscription)
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('ollama:chat:chunk', subscription)
      }
    }
  }
)
