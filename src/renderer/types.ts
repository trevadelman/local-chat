export interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    parameter_size?: string
    quantization_level?: string
  }
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Conversation {
  id: string
  title: string
  model_name: string
  created_at: string
}

export interface ChatChunk {
  model: string
  created_at: string
  message?: {
    role: 'assistant'
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

declare global {
  interface Window {
    api: {
      // Ollama API methods
      listModels: () => Promise<OllamaModel[]>
      chat: (model: string, messages: OllamaMessage[], stream?: boolean) => Promise<any>
      generateCompletion: (model: string, prompt: string) => Promise<any>
      
      // Chat history methods
      createConversation: (title: string, model_name: string) => Promise<Conversation>
      listConversations: () => Promise<Conversation[]>
      getConversation: (id: string) => Promise<Conversation | undefined>
      deleteConversation: (id: string) => Promise<void>
      updateConversation: (id: string, title: string) => Promise<Conversation>
      addMessage: (conversation_id: string, role: 'user' | 'assistant', content: string) => Promise<Message>
      getMessages: (conversation_id: string) => Promise<Message[]>
      
      // App methods
      isDarkMode: () => Promise<boolean>
      setDarkMode: (dark: boolean) => Promise<boolean>
      
      // Event handlers
      onModelLoading: (callback: () => void) => void
      onModelLoaded: (callback: () => void) => void
      onError: (callback: (error: any) => void) => void
      onChatChunk: (callback: (data: ChatChunk) => void) => () => void
    }
  }
}
