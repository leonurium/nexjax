# Nexjax

A lightweight tool to automatically configure iOS project settings for React Native projects. Works with any React Native project (Expo, bare React Native, etc.).

## Why Nexjax?

### The Problem

When developing React Native apps for iOS, you face a frustrating cycle:

1. **Every `expo prebuild --clean` wipes your Xcode settings** - Team ID, code signing, and other configurations are lost
2. **Manual reconfiguration is tedious** - Open Xcode, navigate to signing settings, select team, fix Info.plist values... every single time
3. **CI/CD pipelines become fragile** - Automated builds break when Xcode settings aren't properly configured

### Why Not EAS or Other Solutions?

| Solution | Limitation |
|----------|------------|
| **EAS Build** | Requires Expo account, cloud-based builds, costs money for higher tiers, overkill for simple local builds |
| **Fastlane** | Heavy Ruby dependency, complex setup, steep learning curve, designed for full CI/CD pipelines |
| **Manual Xcode** | Time-consuming, error-prone, doesn't survive prebuild, can't be automated |
| **Expo Config Plugins** | Only works with Expo, requires understanding plugin system, can be complex for simple tasks |

### The Nexjax Approach

Nexjax takes a different philosophy:

- **Zero dependencies** - Pure Node.js, no Ruby, no cloud accounts, no external services
- **Instant setup** - One command: `npx nexjax YOUR_TEAM_ID`
- **Works offline** - No internet required, no accounts needed
- **Universal** - Works with Expo, bare React Native, or any hybrid setup
- **Survives rebuilds** - Stores config in `ios.config.json`, reapply with single command
- **CI/CD friendly** - Simple, predictable, easy to integrate into any pipeline
- **Focused scope** - Does one thing well: configure iOS project settings

### Perfect For

- Developers who prebuild frequently and are tired of reconfiguring Xcode
- Teams who want simple, reliable iOS configuration without cloud dependencies
- CI/CD pipelines that need deterministic, offline-capable builds
- Projects that don't need full EAS/Fastlane but still want automation

## Features

- ✅ **Auto-configure Team ID** - Sets DEVELOPMENT_TEAM in Xcode project
- ✅ **Auto-fill Version** - Updates CFBundleShortVersionString from app.json (Expo) or package.json (bare RN)
- ✅ **Auto-fill Build Number** - Updates CFBundleVersion from app.json or config
- ✅ **Auto-fill Display Name** - Updates CFBundleDisplayName from app.json or package.json
- ✅ **iPhone-only Support** - Removes iPad orientations automatically
- ✅ **Zero Dependencies** - Pure Node.js, no external dependencies
- ✅ **Works with any RN project** - Supports both Expo (app.json) and bare React Native (package.json only)

## Installation

### As a dev dependency:

```bash
npm install --save-dev nexjax
```

### Or use npx (no installation needed):

```bash
npx nexjax
```

## Quick Start

### 1. First Time Setup

1. **Get your Team ID:**
   - Open Xcode → Settings → Accounts
   - Select your Apple ID
   - Copy your Team ID (format: `ABC123DEF4`)

2. **Run the tool:**
   ```bash
   npx nexjax YOUR_TEAM_ID
   ```
   
   Or if installed locally:
   ```bash
   npx nexjax YOUR_TEAM_ID
   ```

3. **Edit `ios.config.json`** (created automatically):
   ```json
   {
     "teamId": "YOUR_TEAM_ID",
     "version": "1.0.0",
     "displayName": "MyApp",
     "buildNumber": "1",
     "iphoneOnly": true,
     "permissions": {
       "NSPhotoLibraryUsageDescription": "We need access to your photos...",
       "NSCameraUsageDescription": "We need access to your camera..."
     }
   }
   ```
   
   **Note:** For Expo projects, permission strings can also be set in `app.json` → `expo.ios.infoPlist` and nexjax will automatically read them!

### 2. Configure Permission Strings (Optional)

**For Expo projects**, add permissions in `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "We need access to your photos...",
        "NSCameraUsageDescription": "We need access to your camera..."
      }
    }
  }
}
```

**For bare RN projects**, add permissions in `ios.config.json`:

```json
{
  "permissions": {
    "NSPhotoLibraryUsageDescription": "We need access to your photos...",
    "NSCameraUsageDescription": "We need access to your camera..."
  }
}
```

### 3. After Building iOS Project

After running `npx expo prebuild` or any iOS build command:

```bash
npx nexjax
```

Or add to your build scripts in `package.json`:

```json
{
  "scripts": {
    "ios:build": "react-native run-ios && npx nexjax",
    "ios:configure": "npx nexjax"
  }
}
```

## Configuration

### Config File: `ios.config.json`

The tool creates `ios.config.json` in your project root with these settings:

```json
{
  "teamId": "ABC123DEF4",
  "bundleIdentifier": "com.example.app",
  "version": "1.0.0",
  "displayName": "MyApp",
  "buildNumber": "1",
  "iphoneOnly": true,
  "permissions": {
    "NSPhotoLibraryUsageDescription": "We need access to your photos...",
    "NSCameraUsageDescription": "We need access to your camera...",
    "NSMicrophoneUsageDescription": "We need access to your microphone..."
  }
}
```

### Auto-sync with app.json / package.json

The tool automatically reads from configuration files:

**For Expo projects (with app.json):**
- `expo.version` → Used for CFBundleShortVersionString
- `expo.name` → Used for CFBundleDisplayName
- `expo.ios.buildNumber` → Used for CFBundleVersion
- `expo.ios.supportsTablet` → Determines iPhone-only setting
- `expo.ios.infoPlist.*` → Permission strings (all optional)

**For bare React Native projects (package.json only):**
- `package.json.version` → Used for CFBundleShortVersionString
- `package.json.name` → Used for CFBundleDisplayName

### Permission Strings (Optional)

Nexjax can automatically configure iOS permission strings in Info.plist. Each permission is **optional** - only add the ones you need.

**Configuration Priority:**
1. `ios.config.json` → `permissions` (always works, overrides app.json)
2. `app.json` → `expo.ios.infoPlist` (Expo projects only)

**For Expo projects:** Can use either `app.json` or `ios.config.json` (or both - ios.config.json overrides)
**For bare RN projects:** Use `ios.config.json` → `permissions` (no app.json available)

**Supported permission keys:**
- `NSPhotoLibraryUsageDescription` - Photo library access
- `NSPhotoLibraryAddUsageDescription` - Save photos to library
- `NSCameraUsageDescription` - Camera access
- `NSMicrophoneUsageDescription` - Microphone access
- `NSLocationWhenInUseUsageDescription` - Location when in use
- `NSLocationAlwaysUsageDescription` - Location always
- `NSContactsUsageDescription` - Contacts access
- `NSCalendarsUsageDescription` - Calendar access
- `NSRemindersUsageDescription` - Reminders access
- `NSMotionUsageDescription` - Motion & Fitness
- `NSHealthShareUsageDescription` - Health data read
- `NSHealthUpdateUsageDescription` - Health data write
- `NSBluetoothPeripheralUsageDescription` - Bluetooth (deprecated, use NSBluetoothAlwaysUsageDescription)
- `NSBluetoothAlwaysUsageDescription` - Bluetooth always
- `NSSpeechRecognitionUsageDescription` - Speech recognition
- `NSFaceIDUsageDescription` - Face ID
- `NSAppleMusicUsageDescription` - Apple Music
- `NSSiriUsageDescription` - Siri
- `NSUserTrackingUsageDescription` - App Tracking Transparency

### Priority Order

**For all settings (version, displayName, buildNumber, etc.):**
1. `ios.config.json` - Primary source (can override everything)
2. `app.json` (Expo) or `package.json` (bare RN) - Source of truth
3. Command line argument - Overrides Team ID only

**For permission strings specifically:**
1. `ios.config.json` → `permissions` - **Always works** (Expo & bare RN)
2. `app.json` → `expo.ios.infoPlist` - Expo projects only (if no ios.config.json permissions)

**Note:** 
- If `app.json` exists, it takes priority over `package.json` for version/name
- If no `app.json`, nexjax reads from `package.json` (bare RN projects)
- **Permission strings work the same way:** `ios.config.json` always works, `app.json` is optional (Expo only)

## Usage Examples

### Basic Usage

```bash
# Configure with Team ID
npx nexjax YOUR_TEAM_ID

# Re-configure (uses saved Team ID from config)
npx nexjax
```

### With npm scripts

```json
{
  "scripts": {
    "prebuild:ios": "cd ios && pod install",
    "postbuild:ios": "npx nexjax",
    "rebuild:ios": "npm run prebuild:ios && npm run postbuild:ios"
  }
}
```

### With Expo

```json
{
  "scripts": {
    "prebuild:ios": "npx expo prebuild --platform ios --clean",
    "postbuild:ios": "npx nexjax",
    "rebuild:ios": "npm run prebuild:ios && npm run postbuild:ios"
  }
}
```

## What It Does

### 1. Team ID Configuration
- Updates `DEVELOPMENT_TEAM` in `ios/*.xcodeproj/project.pbxproj`
- Preserves across rebuilds

### 2. Version & Build Number
- Updates `CFBundleShortVersionString` in `Info.plist`
- Updates `CFBundleVersion` in `Info.plist`

### 3. Display Name
- Updates `CFBundleDisplayName` in `Info.plist`

### 4. iPhone-Only
- Removes `UISupportedInterfaceOrientations~ipad` from `Info.plist`
- Ensures app only runs on iPhone

### 5. Permission Strings (Optional)
- Updates permission strings in `Info.plist`
- Reads from `app.json` (Expo) or `ios.config.json` (bare RN)
- Only configures permissions that are provided (all optional)

## Project Structure

### Expo Projects:
```
your-project/
├── app.json              ← Source of truth (version, name, buildNumber)
├── package.json
├── ios/                  ← Generated by expo prebuild
│   ├── YourApp.xcodeproj/
│   │   └── project.pbxproj
│   └── YourApp/
│       └── Info.plist
└── ios.config.json       ← Created automatically (Team ID, overrides)
```

### Bare React Native Projects:
```
your-project/
├── package.json          ← Source of truth (version, name)
├── ios/
│   ├── YourApp.xcodeproj/
│   │   └── project.pbxproj
│   └── YourApp/
│       └── Info.plist
└── ios.config.json       ← Created automatically (Team ID, buildNumber, overrides)
```

## Troubleshooting

### "ios directory not found"
- Make sure you're in the React Native project root
- Run from the directory containing `ios/` folder

### "Xcode project not found"
- Make sure you've built the iOS project at least once
- For Expo: Run `npx expo prebuild --platform ios` first

### "Info.plist not found"
- The tool will search for Info.plist automatically
- If not found, Team ID configuration will still work

### Team ID not persisting
- Make sure `ios.config.json` has `teamId` set
- Run the tool again after rebuilding iOS project

## API

### Programmatic Usage

```javascript
const { configureIOS } = require('nexjax');

// Configure with Team ID
await configureIOS('/path/to/project', 'YOUR_TEAM_ID');

// Re-configure (uses config file)
await configureIOS('/path/to/project');
```

## License

MIT

## Contributing

Contributions welcome! This is a simple tool designed to be lightweight and dependency-free.
