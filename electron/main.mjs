import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import { db_helpers } from './db.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ollama API client
const ollamaApi = axios.create({
  baseURL: 'http://127.0.0.1:11434/api',
  timeout: 60000, // Increased timeout for streaming
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  // In development, load from the Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost:5173')) {
      event.preventDefault()
    }
  })

  return mainWindow
}

// Handle IPC events
async function setupIpcHandlers(mainWindow) {
  // Ollama API handlers
  ipcMain.handle('ollama:version', async () => {
    try {
      const response = await ollamaApi.get('/version')
      return response.data.version
    } catch (error) {
      console.error('Error getting Ollama version:', error)
      const errorMessage = {
        message: 'Failed to get Ollama version',
        details: error.code === 'ECONNREFUSED'
          ? 'Unable to connect to Ollama. Please make sure it is running.'
          : error.message
      }
      mainWindow.webContents.send('error', errorMessage)
      throw errorMessage
    }
  })

  ipcMain.handle('ollama:pull-model', async (_, modelName) => {
    try {
      const response = await ollamaApi.post('/pull', {
        name: modelName,
        stream: false
      })
      return response.data
    } catch (error) {
      console.error('Error pulling model:', error)
      const errorMessage = {
        message: 'Failed to pull model',
        details: error.code === 'ECONNREFUSED'
          ? `Unable to connect to Ollama. Error: ${error.message}`
          : error.message
      }
      mainWindow.webContents.send('error', errorMessage)
      throw errorMessage
    }
  })

  ipcMain.handle('ollama:list-models', async () => {
    try {
      console.log('Attempting to fetch models from Ollama...')
      const response = await ollamaApi.get('/tags')
      console.log('Successfully fetched models:', response.data)
      return response.data.models
    } catch (error) {
      console.error('Error fetching models:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      })

      if (error.code === 'ECONNREFUSED') {
        const errorMessage = {
          message: 'Unable to connect to Ollama',
          details: `Please make sure Ollama is running and accessible at http://127.0.0.1:11434. Error: ${error.message}`
        }
        mainWindow.webContents.send('error', errorMessage)
        throw errorMessage
      }
      
      const errorMessage = {
        message: 'Failed to fetch models',
        details: `Error: ${error.message}`
      }
      mainWindow.webContents.send('error', errorMessage)
      throw errorMessage
    }
  })

  ipcMain.handle('ollama:show-model', async (_, { model, verbose = false }) => {
    try {
      console.log(`Fetching model info for ${model}...`)
      const response = await ollamaApi.post('/show', {
        model,
        verbose
      })
      console.log('Successfully fetched model info')
      return response.data
    } catch (error) {
      console.error('Error fetching model info:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      })

      if (error.code === 'ECONNREFUSED') {
        const errorMessage = {
          message: 'Unable to connect to Ollama',
          details: `Please make sure Ollama is running and accessible at http://127.0.0.1:11434. Error: ${error.message}`
        }
        mainWindow.webContents.send('error', errorMessage)
        throw errorMessage
      }
      
      const errorMessage = {
        message: 'Failed to fetch model info',
        details: `Error: ${error.message}`
      }
      mainWindow.webContents.send('error', errorMessage)
      throw errorMessage
    }
  })

  ipcMain.handle('ollama:chat', async (_, { model, messages, stream = true }) => {
    try {
      if (!stream) {
        const response = await ollamaApi.post('/chat', {
          model,
          messages,
          stream: false
        })
        return response.data
      }

      // For streaming responses
      const response = await ollamaApi.post('/chat', {
        model,
        messages,
        stream: true
      }, {
        responseType: 'stream'
      })

      let buffer = ''
      
      // Set up event handlers for the stream
      response.data.on('data', (chunk) => {
        buffer += chunk.toString()
        
        // Process complete JSON objects from the buffer
        let newlineIndex
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex)
          buffer = buffer.slice(newlineIndex + 1)
          
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              mainWindow.webContents.send('ollama:chat:chunk', data)
            } catch (e) {
              console.error('Error parsing JSON:', e)
            }
          }
        }
      })

      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve({ done: true })
        })

        response.data.on('error', (error) => {
          reject(error)
        })
      })
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        message: 'Chat failed',
        details: error.code === 'ECONNREFUSED' 
          ? `Unable to connect to Ollama. Error: ${error.message}`
          : error.message
      }
      mainWindow.webContents.send('error', errorMessage)
      throw errorMessage
    }
  })

  ipcMain.handle('ollama:generate', async (_, { model, prompt }) => {
    try {
      const response = await ollamaApi.post('/generate', {
        model,
        prompt,
        stream: false
      })
      return response.data
    } catch (error) {
      console.error('Generate error:', error)
      const errorMessage = {
        message: 'Generation failed',
        details: error.code === 'ECONNREFUSED'
          ? `Unable to connect to Ollama. Error: ${error.message}`
          : error.message
      }
      mainWindow.webContents.send('error', errorMessage)
      throw errorMessage
    }
  })

  // Chat history handlers
  ipcMain.handle('conversation:create', async (_, { title, model_name, system_prompt }) => {
    try {
      return db_helpers.createConversation(title, model_name, system_prompt)
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw { message: 'Failed to create conversation', details: error.message }
    }
  })

  ipcMain.handle('conversation:list', async () => {
    try {
      return db_helpers.listConversations()
    } catch (error) {
      console.error('Error listing conversations:', error)
      throw { message: 'Failed to list conversations', details: error.message }
    }
  })

  ipcMain.handle('conversation:get', async (_, { id }) => {
    try {
      return db_helpers.getConversation(id)
    } catch (error) {
      console.error('Error getting conversation:', error)
      throw { message: 'Failed to get conversation', details: error.message }
    }
  })

  ipcMain.handle('conversation:delete', async (_, { id }) => {
    try {
      return db_helpers.deleteConversation(id)
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw { message: 'Failed to delete conversation', details: error.message }
    }
  })

  ipcMain.handle('conversation:update', async (_, { id, title, system_prompt }) => {
    try {
      return db_helpers.updateConversationTitle(id, title, system_prompt)
    } catch (error) {
      console.error('Error updating conversation:', error)
      throw { message: 'Failed to update conversation', details: error.message }
    }
  })

  ipcMain.handle('conversation:update-system-prompt', async (_, { id, system_prompt }) => {
    try {
      return db_helpers.updateSystemPrompt(id, system_prompt)
    } catch (error) {
      console.error('Error updating conversation:', error)
      throw { message: 'Failed to update conversation', details: error.message }
    }
  })

  ipcMain.handle('message:add', async (_, { conversation_id, role, content }) => {
    try {
      return db_helpers.addMessage(conversation_id, role, content)
    } catch (error) {
      console.error('Error adding message:', error)
      throw { message: 'Failed to add message', details: error.message }
    }
  })

  ipcMain.handle('message:list', async (_, { conversation_id }) => {
    try {
      return db_helpers.getMessages(conversation_id)
    } catch (error) {
      console.error('Error listing messages:', error)
      throw { message: 'Failed to list messages', details: error.message }
    }
  })

  // App theme handlers
  ipcMain.handle('app:get-dark-mode', () => {
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('app:set-dark-mode', (_, dark) => {
    nativeTheme.themeSource = dark ? 'dark' : 'light'
    return nativeTheme.shouldUseDarkColors
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  const mainWindow = createWindow()
  setupIpcHandlers(mainWindow)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Disable navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== 'http://localhost:5173') {
      event.preventDefault()
    }
  })
})
