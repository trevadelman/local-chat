# macOS Application Packaging Guide

This guide outlines the process of packaging Local Chat as a proper macOS application that can be pinned to the dock.

## 1. Application Icon

### Creating the Icon Set
1. Create a high-resolution app icon (1024x1024 pixels) in PNG format
2. Generate the `.icns` file with all required sizes:
   ```
   16x16
   32x32
   64x64
   128x128
   256x256
   512x512
   1024x1024
   ```

### Icon Creation Process
1. Create `icon.iconset` directory:
   ```bash
   mkdir icon.iconset
   ```

2. Generate each required size:
   ```bash
   sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   ```

3. Convert to `.icns`:
   ```bash
   iconutil -c icns icon.iconset
   ```

4. Place the resulting `icon.icns` in:
   ```
   build/icon.icns
   ```

## 2. electron-builder Configuration

### Update package.json
```json
{
  "build": {
    "appId": "com.trevadelman.localchat",
    "productName": "Local Chat",
    "copyright": "Copyright © 2025 Trevor Adelman",
    "mac": {
      "category": "public.app-category.developer-tools",
      "icon": "build/icon.icns",
      "target": ["dmg", "zip"],
      "darkModeSupport": true,
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "dmg": {
      "icon": "build/icon.icns",
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ],
      "window": {
        "width": 540,
        "height": 400
      }
    }
  }
}
```

### Create entitlements.mac.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.debugger</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
  </dict>
</plist>
```

## 3. Application Info.plist

Create `build/Info.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDocumentTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeName</key>
            <string>Local Chat Document</string>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
            <key>LSHandlerRank</key>
            <string>Owner</string>
        </dict>
    </array>
    <key>LSMinimumSystemVersion</key>
    <string>10.15.0</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.developer-tools</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
</dict>
</plist>
```

## 4. Building the Application

1. Install development dependencies:
   ```bash
   npm install --save-dev electron-builder
   npm install --save-dev @electron/notarize
   ```

2. Add build scripts to package.json:
   ```json
   {
     "scripts": {
       "build:mac": "electron-builder --mac",
       "build:dmg": "electron-builder --mac dmg",
       "build:mas": "electron-builder --mac mas"
     }
   }
   ```

3. Build the application:
   ```bash
   # Development build
   npm run build:mac
   
   # Distribution DMG
   npm run build:dmg
   ```

The built application will be in the `dist` directory.

## 5. Installing and Pinning

1. Drag the `.app` from the DMG to `/Applications`
2. Launch the application from `/Applications`
3. Right-click the dock icon and select "Options > Keep in Dock"

## 6. Code Signing (Optional)

For distribution outside of development:

1. Obtain an Apple Developer ID
2. Export certificates from Keychain Access
3. Add to electron-builder config:
   ```json
   {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAMID)"
     }
   }
   ```

## 7. Notarization (Optional)

For distribution outside of development:

1. Create app-specific password for Apple ID
2. Add notarization config:
   ```javascript
   // electron-builder.js
   require('dotenv').config();
   
   module.exports = {
     afterSign: async (context) => {
       const { notarize } = require('@electron/notarize');
       const { appOutDir } = context;
   
       if (process.platform !== 'darwin') return;
   
       console.log('Notarizing macOS application...');
   
       await notarize({
         appBundleId: 'com.trevadelman.localchat',
         appPath: `${appOutDir}/Local Chat.app`,
         appleId: process.env.APPLE_ID,
         appleIdPassword: process.env.APPLE_ID_PASSWORD,
         teamId: process.env.APPLE_TEAM_ID
       });
     }
   };
   ```

## Directory Structure

```
local-chat/
├── build/
│   ├── icon.icns
│   ├── entitlements.mac.plist
│   └── Info.plist
├── src/
│   └── ...
├── package.json
└── electron-builder.js
```

## Common Issues

1. **App Won't Launch**
   - Check code signing
   - Verify entitlements
   - Check console logs: `/Applications/Utilities/Console.app`

2. **Icon Not Showing**
   - Verify icon.icns path
   - Check icon file format
   - Clear icon cache: `killall Dock`

3. **Dock Pin Not Persisting**
   - Ensure app is in `/Applications`
   - Check file permissions
   - Rebuild Dock preferences: `killall -KILL Dock`

## Resources

- [electron-builder docs](https://www.electron.build/configuration/mac)
- [Apple Developer Documentation](https://developer.apple.com/documentation/xcode/preparing-your-app-for-distribution)
- [Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
