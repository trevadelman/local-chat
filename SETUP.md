# Local Chat Setup Guide

This guide walks through setting up Local Chat for development and building it for distribution.

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- [Ollama](https://ollama.ai) installed and running
- macOS with Apple Silicon (for running the built app)

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/trevadelman/local-chat.git
   cd local-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run electron:dev
   ```

This will launch the app in development mode with hot reloading.

## Building for Distribution

### Building the App

#### For macOS
1. Ensure you're on a Mac with Apple Silicon
2. Run the build command:
   ```bash
   npm run build:mac
   ```

This will create two files in the `dist` directory:
- `Local Chat-1.0.0-arm64.dmg` - Installer for macOS
- `Local Chat-1.0.0-arm64-mac.zip` - Zipped application

#### For Windows
1. Run the build command:
   ```bash
   npm run build:win
   ```

This will create two files in the `dist` directory:
- `Local Chat Setup.exe` - Windows installer (NSIS)
- `Local Chat.exe` - Portable executable

### Installing the Built App

#### On macOS
1. Double-click the DMG file
2. Drag Local Chat to your Applications folder
3. Launch Local Chat from Applications
4. (Optional) Right-click the dock icon and select "Options > Keep in Dock"

Note: Since the app isn't signed with an Apple Developer certificate, you might see a security warning on first launch. To bypass this:
1. Right-click (or Control-click) the app in Finder
2. Select "Open" from the context menu
3. Click "Open" in the security dialog

#### On Windows
Option 1 - Installer:
1. Run `Local Chat Setup.exe`
2. Choose installation directory
3. Select whether to create desktop/start menu shortcuts
4. Complete installation
5. Launch from Start Menu or desktop shortcut

Option 2 - Portable:
1. Copy `Local Chat.exe` to desired location
2. Double-click to run (no installation needed)
3. (Optional) Create desktop shortcut

## Running the App

1. Ensure Ollama is running on your system
2. Launch Local Chat
3. Select a model from the dropdown (if you haven't downloaded any models, you'll need to do that through Ollama first)
4. Start chatting!

## Troubleshooting

### Common Issues

1. **App won't launch**
   - Ensure Ollama is running
   - Check Console.app for error messages
   - Try removing and reinstalling the app

2. **No models showing**
   - Verify Ollama is running (`ps aux | grep ollama`)
   - Check if you have any models installed (`ollama list`)
   - Try restarting Ollama

3. **Build errors**
   - Clear the `dist` directory
   - Remove `node_modules` and run `npm install` again
   - Ensure you're using the correct Node.js version

### Getting Help

If you encounter issues:
1. Check the [Issues](https://github.com/trevadelman/local-chat/issues) page
2. Look for error messages in the development console
3. Create a new issue with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Error messages
   - System information (OS version, Node version, etc.)
