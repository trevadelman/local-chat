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
  role: 'user' | 'assistant'
  content: string
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
      listModels: () => Promise<OllamaModel[]>
      chat: (model: string, messages: Message[], stream?: boolean) => Promise<any>
      generateCompletion: (model: string, prompt: string) => Promise<any>
      isDarkMode: () => Promise<boolean>
      setDarkMode: (dark: boolean) => Promise<boolean>
      onModelLoading: (callback: () => void) => void
      onModelLoaded: (callback: () => void) => void
      onError: (callback: (error: any) => void) => void
      onChatChunk: (callback: (data: ChatChunk) => void) => () => void
    }
  }
}
