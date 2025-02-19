import React, { useEffect, useState } from 'react'
import { Conversation } from '../types'

interface ConversationSidebarProps {
  onSelectConversation: (conversation: Conversation) => void
  currentConversation: Conversation | null
  onNewChat: () => void
}

export function ConversationSidebar({ onSelectConversation, currentConversation, onNewChat }: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const list = await window.api.listConversations()
      setConversations(list)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation()
    try {
      await window.api.deleteConversation(conversation.id)
      setConversations(prev => prev.filter(c => c.id !== conversation.id))
      if (currentConversation?.id === conversation.id) {
        onNewChat()
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleUpdateTitle = async (e: React.FormEvent, conversation: Conversation) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const updatedConversation = await window.api.updateConversation(conversation.id, editTitle)
      setConversations(prev => prev.map(c => 
        c.id === conversation.id ? updatedConversation : c
      ))
      setEditingId(null)
    } catch (error) {
      console.error('Error updating conversation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="w-64 border-r dark:border-gray-700 p-4">
        <p className="text-gray-500 dark:text-gray-400">Loading conversations...</p>
      </div>
    )
  }

  return (
    <div className="w-64 border-r dark:border-gray-700 p-4 flex flex-col gap-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Conversations
        </h2>
        <button
          onClick={onNewChat}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          New Chat
        </button>
      </div>
      {conversations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
      ) : (
        conversations.map(conversation => (
          <div
            key={conversation.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              currentConversation?.id === conversation.id
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                {editingId === conversation.id ? (
                  <form 
                    onSubmit={(e) => handleUpdateTitle(e, conversation)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter title..."
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </form>
                ) : (
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {conversation.title}
                  </h3>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(conversation.created_at)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {conversation.model_name}
                </p>
              </div>
              {editingId !== conversation.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(conversation.id)
                      setEditTitle(conversation.title)
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
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
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, conversation)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
