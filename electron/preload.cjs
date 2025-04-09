const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Ollama API methods
    getOllamaVersion: () => ipcRenderer.invoke('ollama:version'),
    listModels: () => ipcRenderer.invoke('ollama:list-models'),
    pullModel: (name) => ipcRenderer.invoke('ollama:pull-model', name),
    showModel: (model, verbose = false) => ipcRenderer.invoke('ollama:show-model', { model, verbose }),
    chat: (model, messages, stream = true) => ipcRenderer.invoke('ollama:chat', { model, messages, stream }),
    generateCompletion: (model, prompt) => ipcRenderer.invoke('ollama:generate', { model, prompt }),
    
    // Chat history methods
    createConversation: (title, model_name, system_prompt) => 
      ipcRenderer.invoke('conversation:create', { title, model_name, system_prompt }),
    listConversations: () => 
      ipcRenderer.invoke('conversation:list'),
    getConversation: (id) => 
      ipcRenderer.invoke('conversation:get', { id }),
    deleteConversation: (id) => 
      ipcRenderer.invoke('conversation:delete', { id }),
    updateConversation: (id, title, system_prompt) =>
      ipcRenderer.invoke('conversation:update', { id, title, system_prompt }),
    updateSystemPrompt: (id, system_prompt) =>
      ipcRenderer.invoke('conversation:update-system-prompt', { id, system_prompt }),
    addMessage: (conversation_id, role, content) => 
      ipcRenderer.invoke('message:add', { conversation_id, role, content }),
    getMessages: (conversation_id) => 
      ipcRenderer.invoke('message:list', { conversation_id }),
    
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
