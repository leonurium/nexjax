# Changelog

## [1.0.0] - 2026-01-27

### Added
- ✅ Auto-configure Team ID in Xcode project
- ✅ Auto-fill version from app.json (Expo) or package.json (bare RN)
- ✅ Auto-fill build number from app.json or config
- ✅ Auto-fill display name from app.json or package.json
- ✅ iPhone-only support (removes iPad orientations)
- ✅ **Permission strings configuration** - Optional Info.plist permission strings
  - Reads from `app.json` (Expo projects) → `expo.ios.infoPlist`
  - Reads from `ios.config.json` (all projects) → `permissions`
  - All permissions are optional - only configure what you need
  - Supports all iOS permission keys ending with "UsageDescription"

### Features
- Works with Expo projects (reads from app.json)
- Works with bare React Native projects (reads from package.json)
- Auto-detects project type
- Zero dependencies
- All settings are optional and configurable

### Supported Permission Keys
All permission keys ending with "UsageDescription" are supported, including:
- NSPhotoLibraryUsageDescription
- NSPhotoLibraryAddUsageDescription
- NSCameraUsageDescription
- NSMicrophoneUsageDescription
- NSLocationWhenInUseUsageDescription
- NSLocationAlwaysUsageDescription
- NSLocationAlwaysAndWhenInUseUsageDescription
- NSContactsUsageDescription
- NSCalendarsUsageDescription
- NSRemindersUsageDescription
- NSMotionUsageDescription
- NSHealthShareUsageDescription
- NSHealthUpdateUsageDescription
- NSBluetoothAlwaysUsageDescription
- NSSpeechRecognitionUsageDescription
- NSFaceIDUsageDescription
- NSAppleMusicUsageDescription
- NSSiriUsageDescription
- NSUserTrackingUsageDescription
- And any other key ending with "UsageDescription"


## [1.0.6] - 2026-02-11

### Added
- **Info.plist boolean support**:
  - Reads boolean keys from `app.json` → `expo.ios.infoPlist` (e.g. `ITSAppUsesNonExemptEncryption`, `UIRequiresFullScreen`, etc.).
  - Allows overriding/defining boolean keys in `ios.config.json` via the `infoPlist` section.
  - Automatically writes/updates corresponding `<key>...</key><true|false/>` entries in `Info.plist`.

- **GitHub Packages registry support**:
  - Package is now also available as `@leonurium/nexjax` on `https://npm.pkg.github.com`.
  - CI workflow publishes to both npmjs (`nexjax`) and GitHub Packages (`@leonurium/nexjax`) from the same source.