# Nexjax Usage Examples

## Expo Projects (with app.json)

### Example app.json:
```json
{
  "expo": {
    "name": "MyApp",
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1",
      "supportsTablet": false,
      "bundleIdentifier": "com.example.app"
    }
  }
}
```

**Nexjax will automatically:**
- Read version from `expo.version` → `1.0.0`
- Read display name from `expo.name` → `MyApp`
- Read build number from `expo.ios.buildNumber` → `1`
- Detect iPhone-only from `expo.ios.supportsTablet: false`

### Usage:
```bash
npx nexjax YOUR_TEAM_ID
```

Creates `ios.config.json`:
```json
{
  "teamId": "YOUR_TEAM_ID",
  "version": "1.0.0",
  "displayName": "MyApp",
  "buildNumber": "1",
  "iphoneOnly": true
}
```

## Bare React Native Projects (no app.json)

### Example package.json:
```json
{
  "name": "MyApp",
  "version": "1.0.0"
}
```

**Nexjax will automatically:**
- Read version from `package.json.version` → `1.0.0`
- Read display name from `package.json.name` → `MyApp`
- Use default build number → `1`
- Default to iPhone-only → `true`

### Usage:
```bash
npx nexjax YOUR_TEAM_ID
```

Creates `ios.config.json`:
```json
{
  "teamId": "YOUR_TEAM_ID",
  "version": "1.0.0",
  "displayName": "MyApp",
  "buildNumber": "1",
  "iphoneOnly": true
}
```

## Overriding Values

You can override any value in `ios.config.json`:

```json
{
  "teamId": "YOUR_TEAM_ID",
  "version": "2.0.0",  // Override app.json/package.json
  "displayName": "Custom Name",  // Override app.json/package.json
  "buildNumber": "10",
  "iphoneOnly": false
}
```

**Priority:**
1. `ios.config.json` (highest priority)
2. `app.json` (Expo) or `package.json` (bare RN)
3. Defaults

## Workflow Examples

### Expo Project:
```bash
# 1. Update app.json
# 2. Rebuild iOS
npx expo prebuild --platform ios --clean
# 3. Auto-configure
npx nexjax YOUR_TEAM_ID
```

### Bare React Native:
```bash
# 1. Update package.json version
# 2. Pod install
cd ios && pod install && cd ..
# 3. Auto-configure
npx nexjax YOUR_TEAM_ID
```

## Updating Version

### Expo:
```json
// app.json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

Run: `npx nexjax` (automatically picks up new version)

### Bare RN:
```json
// package.json
{
  "version": "1.0.1"
}
```

Run: `npx nexjax` (automatically picks up new version)
