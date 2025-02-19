import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize database in the user's app data directory
const dbPath = path.join(app.getPath('userData'), 'chat-history.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model_name TEXT NOT NULL,
    created_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );
`)

// Database operations
export const dbOperations = {
  // Conversations
  createConversation: db.prepare(`
    INSERT INTO conversations (id, title, model_name, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `),

  updateConversation: db.prepare(`
    UPDATE conversations
    SET title = ?
    WHERE id = ?
  `),

  getConversation: db.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `),

  listConversations: db.prepare(`
    SELECT * FROM conversations ORDER BY created_at DESC
  `),

  deleteConversation: db.prepare(`
    DELETE FROM conversations WHERE id = ?
  `),

  // Messages
  addMessage: db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `),

  getMessages: db.prepare(`
    SELECT * FROM messages 
    WHERE conversation_id = ? 
    ORDER BY created_at ASC
  `)
}

// Helper functions
export const db_helpers = {
  createConversation(title, model_name) {
    const id = uuidv4()
    dbOperations.createConversation.run(id, title, model_name)
    return dbOperations.getConversation.get(id)
  },

  getConversation(id) {
    return dbOperations.getConversation.get(id)
  },

  listConversations() {
    return dbOperations.listConversations.all()
  },

  deleteConversation(id) {
    dbOperations.deleteConversation.run(id)
  },

  updateConversationTitle(id, title) {
    dbOperations.updateConversation.run(title, id)
    return dbOperations.getConversation.get(id)
  },

  addMessage(conversationId, role, content) {
    const id = uuidv4()
    dbOperations.addMessage.run(id, conversationId, role, content)
    return {
      id,
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString()
    }
  },

  getMessages(conversationId) {
    return dbOperations.getMessages.all(conversationId)
  }
}

// Export database instance for direct access if needed
export default db
