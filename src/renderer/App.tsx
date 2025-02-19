import { useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { ConversationSidebar } from './components/ConversationSidebar'
import { Conversation } from './types'

function App() {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation)
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
            
            <div className="flex-1">
              <ChatInterface 
                currentConversation={currentConversation}
                onConversationCreated={setCurrentConversation}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
