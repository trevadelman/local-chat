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

export interface OllamaModelInfo {
  modelfile: string
  parameters: string
  template: string
  details: {
    parent_model: string
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
  model_info: {
    [key: string]: string | number | boolean | string[] | null | undefined
    "general.architecture"?: string
    "general.file_type"?: number
    "general.parameter_count"?: number
    "general.quantization_version"?: number
    "llama.context_length"?: number
  }
  capabilities: string[]
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
  system_prompt: string
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
      getOllamaVersion: () => Promise<string>
      listModels: () => Promise<OllamaModel[]>
      pullModel: (name: string) => Promise<{ status: string }>
      showModel: (model: string, verbose?: boolean) => Promise<OllamaModelInfo>
      chat: (model: string, messages: OllamaMessage[], stream?: boolean) => Promise<{
        message: OllamaMessage
        done: boolean
        prompt_eval_count?: number
        eval_count?: number
      }>
      generateCompletion: (model: string, prompt: string) => Promise<{
        response: string
        done: boolean
      }>
      
      // Chat history methods
      createConversation: (title: string, model_name: string, system_prompt?: string) => Promise<Conversation>
      listConversations: () => Promise<Conversation[]>
      getConversation: (id: string) => Promise<Conversation | undefined>
      deleteConversation: (id: string) => Promise<void>
      updateConversation: (id: string, title: string, system_prompt: string) => Promise<Conversation>
      updateSystemPrompt: (id: string, system_prompt: string) => Promise<Conversation>
      addMessage: (conversation_id: string, role: 'user' | 'assistant', content: string) => Promise<Message>
      getMessages: (conversation_id: string) => Promise<Message[]>
      
      // App methods
      isDarkMode: () => Promise<boolean>
      setDarkMode: (dark: boolean) => Promise<boolean>
      
      // Event handlers
      onModelLoading: (callback: () => void) => void
      onModelLoaded: (callback: () => void) => void
      onError: (callback: (error: { message: string; details?: string }) => void) => void
      onChatChunk: (callback: (data: ChatChunk) => void) => () => void
    }
  }
}
