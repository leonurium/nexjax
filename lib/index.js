const fs = require("fs");
const path = require("path");

/**
 * Find Xcode project file
 */
function findXcodeProject(iosPath) {
  const files = fs.readdirSync(iosPath);
  const xcodeproj = files.find((f) => f.endsWith(".xcodeproj"));
  if (!xcodeproj) {
    throw new Error("Xcode project (.xcodeproj) not found in ios directory");
  }
  return path.join(iosPath, xcodeproj, "project.pbxproj");
}

/**
 * Find Info.plist file
 */
function findInfoPlist(iosPath) {
  // Common locations for Info.plist
  const commonPaths = [
    path.join(iosPath, "Info.plist"),
    path.join(iosPath, path.basename(iosPath), "Info.plist"),
  ];

  // Try to find in any subdirectory
  const findInDir = (dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === "Info.plist") {
          return fullPath;
        }
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const found = findInDir(fullPath);
          if (found) return found;
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  };

  // Check common paths first
  for (const plistPath of commonPaths) {
    if (fs.existsSync(plistPath)) {
      return plistPath;
    }
  }

  // Search recursively
  return findInDir(iosPath);
}

/**
 * Read package.json to get app info
 */
function readPackageJson(projectRoot) {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("package.json not found");
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

/**
 * Read app.json (Expo projects)
 */
function readAppJson(projectRoot) {
  const appJsonPath = path.join(projectRoot, "app.json");
  if (fs.existsSync(appJsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    } catch (e) {
      // Invalid JSON, ignore
      return null;
    }
  }
  return null;
}

/**
 * Read or create config file
 * Priority: ios.config.json (overrides) > app.json (Expo) > package.json (bare RN)
 */
function readConfig(projectRoot) {
  const configPath = path.join(projectRoot, "ios.config.json");

  // Read existing config (if any)
  let existingConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      // Invalid JSON, start fresh
      existingConfig = {};
    }
  }

  // Read package.json (always available)
  const packageJson = readPackageJson(projectRoot);

  // Try to read app.json (Expo projects)
  const appJson = readAppJson(projectRoot);

  // Build base config from app.json (Expo) or package.json (bare RN)
  // app.json takes priority if it exists
  const baseConfig = {
    bundleIdentifier:
      appJson?.expo?.ios?.bundleIdentifier ||
      packageJson.name ||
      "com.example.app",
    version: appJson?.expo?.version || packageJson.version || "1.0.0",
    displayName: appJson?.expo?.name || packageJson.name || "MyApp",
    buildNumber: appJson?.expo?.ios?.buildNumber || "1",
    iphoneOnly:
      appJson?.expo?.ios?.supportsTablet !== undefined
        ? !appJson.expo.ios.supportsTablet
        : true,
  };

  // Read permission strings and boolean Info.plist keys from app.json (Expo)
  let permissions = {};
  let infoPlistBooleans = {};

  if (appJson?.expo?.ios?.infoPlist) {
    const infoPlist = appJson.expo.ios.infoPlist;

    Object.keys(infoPlist).forEach((key) => {
      const value = infoPlist[key];

      // Permission strings: keys ending with "UsageDescription"
      if (key.endsWith("UsageDescription") && typeof value === "string") {
        permissions[key] = value;
        return;
      }

      // Generic boolean Info.plist entries (e.g. ITSAppUsesNonExemptEncryption)
      if (typeof value === "boolean") {
        infoPlistBooleans[key] = value;
      }
    });
  }

  // Merge permissions: existingConfig (ios.config.json) overrides app.json
  if (
    existingConfig.permissions &&
    typeof existingConfig.permissions === "object"
  ) {
    permissions = { ...permissions, ...existingConfig.permissions };
  }

  // Merge Info.plist booleans: ios.config.json → infoPlist (overrides)
  if (
    existingConfig.infoPlist &&
    typeof existingConfig.infoPlist === "object"
  ) {
    Object.keys(existingConfig.infoPlist).forEach((key) => {
      const value = existingConfig.infoPlist[key];
      if (typeof value === "boolean") {
        infoPlistBooleans[key] = value;
      }
    });
  }

  // Merge: baseConfig (from app.json/package.json) + existingConfig (overrides)
  // existingConfig values take priority if they exist
  const finalConfig = {
    teamId: existingConfig.teamId || "",
    bundleIdentifier:
      existingConfig.bundleIdentifier || baseConfig.bundleIdentifier,
    version: existingConfig.version || baseConfig.version,
    displayName: existingConfig.displayName || baseConfig.displayName,
    buildNumber: existingConfig.buildNumber || baseConfig.buildNumber,
    iphoneOnly:
      existingConfig.iphoneOnly !== undefined
        ? existingConfig.iphoneOnly
        : baseConfig.iphoneOnly,
    permissions: Object.keys(permissions).length > 0 ? permissions : undefined,
    infoPlist:
      Object.keys(infoPlistBooleans).length > 0 ? infoPlistBooleans : undefined,
  };

  // Remove undefined optional fields to keep config clean
  if (!finalConfig.permissions) {
    delete finalConfig.permissions;
  }
  if (!finalConfig.infoPlist) {
    delete finalConfig.infoPlist;
  }

  // Save config file (always keep it in sync)
  fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));

  return finalConfig;
}

/**
 * Configure Team ID in Xcode project
 */
function configureTeamID(projectFile, teamId) {
  if (!teamId || teamId === "") {
    return false;
  }

  let projectContent = fs.readFileSync(projectFile, "utf8");
  const hasDevelopmentTeam = /DEVELOPMENT_TEAM\s*=/.test(projectContent);

  if (hasDevelopmentTeam) {
    projectContent = projectContent.replace(
      /DEVELOPMENT_TEAM\s*=\s*[^;]+;/g,
      `DEVELOPMENT_TEAM = ${teamId};`,
    );
  } else {
    projectContent = projectContent.replace(
      /(buildSettings\s*=\s*\{)/g,
      `$1\n\t\t\t\tDEVELOPMENT_TEAM = ${teamId};`,
    );
  }

  fs.writeFileSync(projectFile, projectContent, "utf8");
  return true;
}

/**
 * Configure Info.plist
 */
function configureInfoPlist(infoPlistPath, config) {
  let content = fs.readFileSync(infoPlistPath, "utf8");
  let updated = false;

  // Update version
  if (config.version) {
    content = content.replace(
      /<key>CFBundleShortVersionString<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleShortVersionString</key>\n    <string>${config.version}</string>`,
    );
    updated = true;
  }

  // Update build number
  if (config.buildNumber) {
    content = content.replace(
      /<key>CFBundleVersion<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleVersion</key>\n    <string>${config.buildNumber}</string>`,
    );
    updated = true;
  }

  // Update display name
  if (config.displayName) {
    content = content.replace(
      /<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleDisplayName</key>\n    <string>${config.displayName}</string>`,
    );
    updated = true;
  }

  // Remove iPad orientations if iPhone-only
  if (config.iphoneOnly) {
    const beforeLength = content.length;
    content = content.replace(
      /<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>\s*/,
      "",
    );
    if (content.length !== beforeLength) {
      updated = true;
    }
  }

  // Configure permission strings (optional)
  if (config.permissions && typeof config.permissions === "object") {
    const permissionKeys = Object.keys(config.permissions);
    permissionKeys.forEach((key) => {
      const value = config.permissions[key];
      if (value && typeof value === "string") {
        // Escape special regex characters in key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Check if key already exists
        const keyPattern = new RegExp(
          `<key>${escapedKey}<\\/key>\\s*<string>[^<]*<\\/string>`,
          "g",
        );
        if (keyPattern.test(content)) {
          // Update existing permission
          content = content.replace(
            new RegExp(
              `<key>${escapedKey}<\\/key>\\s*<string>[^<]*<\\/string>`,
            ),
            `<key>${key}</key>\n    <string>${value}</string>`,
          );
          updated = true;
        } else {
          // Add new permission before </dict> closing tag
          // Find the last entry before </dict>
          const dictCloseIndex = content.lastIndexOf("</dict>");
          if (dictCloseIndex !== -1) {
            // Insert before </dict>, maintaining proper indentation
            const beforeDict = content.substring(0, dictCloseIndex);
            const afterDict = content.substring(dictCloseIndex);
            content =
              beforeDict +
              `    <key>${key}</key>\n    <string>${value}</string>\n` +
              afterDict;
            updated = true;
          }
        }
      }
    });
  }

  // Configure generic boolean Info.plist keys (e.g. ITSAppUsesNonExemptEncryption)
  if (config.infoPlist && typeof config.infoPlist === "object") {
    Object.keys(config.infoPlist).forEach((key) => {
      const value = config.infoPlist[key];
      if (typeof value === "boolean") {
        const boolTag = value ? "<true/>" : "<false/>";

        // Escape special regex characters in key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Pattern for existing boolean key
        const keyPattern = new RegExp(
          `<key>${escapedKey}<\\/key>\\s*<(true|false)\\s*\\/>`,
          "g",
        );

        if (keyPattern.test(content)) {
          // Update existing boolean key
          content = content.replace(
            new RegExp(
              `<key>${escapedKey}<\\/key>\\s*<(true|false)\\s*\\/>`,
            ),
            `<key>${key}</key>\n    ${boolTag}`,
          );
        } else {
          // Add new boolean key before </dict>
          const dictCloseIndex = content.lastIndexOf("</dict>");
          if (dictCloseIndex !== -1) {
            const beforeDict = content.substring(0, dictCloseIndex);
            const afterDict = content.substring(dictCloseIndex);
            content =
              beforeDict +
              `    <key>${key}</key>\n    ${boolTag}\n` +
              afterDict;
          }
        }
        updated = true;
      }
    });
  }

  if (updated) {
    fs.writeFileSync(infoPlistPath, content, "utf8");
  }

  return updated;
}

/**
 * Main configuration function
 */
async function configureIOS(projectRoot, teamIdArg = null) {
  console.log("🔧 Configuring iOS project settings...\n");

  // Validate project structure
  const iosPath = path.join(projectRoot, "ios");
  if (!fs.existsSync(iosPath)) {
    throw new Error(
      "ios directory not found. Make sure you are in a React Native project root.",
    );
  }

  // Read config (automatically syncs with app.json or package.json)
  const config = readConfig(projectRoot);

  // Override Team ID if provided as argument
  if (teamIdArg) {
    config.teamId = teamIdArg;
    const configPath = path.join(projectRoot, "ios.config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Team ID saved to config: ${teamIdArg}\n`);
  }

  // Detect and log project type
  const appJson = readAppJson(projectRoot);
  if (appJson?.expo) {
    console.log("📱 Detected Expo project (reading from app.json)\n");
  } else {
    console.log(
      "📱 Detected bare React Native project (reading from package.json)\n",
    );
  }

  // Find Xcode project
  const projectFile = findXcodeProject(iosPath);
  if (!fs.existsSync(projectFile)) {
    throw new Error(`Xcode project file not found: ${projectFile}`);
  }

  // Configure Team ID
  if (configureTeamID(projectFile, config.teamId)) {
    console.log(`✅ Updated DEVELOPMENT_TEAM: ${config.teamId}`);
  } else if (!config.teamId || config.teamId === "") {
    console.log("⚠️  No Team ID configured (skipping)");
  }

  // Find and configure Info.plist
  const infoPlistPath = findInfoPlist(iosPath);
  if (infoPlistPath && fs.existsSync(infoPlistPath)) {
    if (configureInfoPlist(infoPlistPath, config)) {
      console.log(`✅ Updated version: ${config.version}`);
      console.log(`✅ Updated build number: ${config.buildNumber}`);
      console.log(`✅ Updated display name: ${config.displayName}`);
      if (config.iphoneOnly) {
        console.log("✅ Configured iPhone-only (removed iPad orientations)");
      }
      if (config.infoPlist && Object.keys(config.infoPlist).length > 0) {
        const boolCount = Object.keys(config.infoPlist).length;
        console.log(`✅ Configured ${boolCount} Info.plist boolean key(s)`);
      }
      // Log permission strings configured
      if (config.permissions && Object.keys(config.permissions).length > 0) {
        const permissionCount = Object.keys(config.permissions).length;
        console.log(`✅ Configured ${permissionCount} permission string(s)`);
      }
    }
  } else {
    console.log("⚠️  Info.plist not found (skipping Info.plist updates)");
  }

  console.log("\n✅ iOS configuration complete!");
  console.log("\n📋 Configuration Summary:");
  if (config.teamId && config.teamId !== "") {
    console.log(`   Team ID: ${config.teamId}`);
  }
  console.log(`   Version: ${config.version}`);
  console.log(`   Build Number: ${config.buildNumber}`);
  console.log(`   Display Name: ${config.displayName}`);
  console.log(`   iPhone Only: ${config.iphoneOnly ? "Yes" : "No"}`);
  if (config.infoPlist && Object.keys(config.infoPlist).length > 0) {
    console.log(
      `   Info.plist booleans: ${Object.keys(config.infoPlist).length} configured`,
    );
    Object.keys(config.infoPlist).forEach((key) => {
      console.log(
        `     - ${key}: ${
          config.infoPlist[key] ? "true" : "false"
        }`,
      );
    });
  }
  if (config.permissions && Object.keys(config.permissions).length > 0) {
    console.log(
      `   Permissions: ${Object.keys(config.permissions).length} configured`,
    );
    Object.keys(config.permissions).forEach((key) => {
      console.log(`     - ${key}`);
    });
  }
  console.log("\n💡 Tip: Edit ios.config.json to customize settings");
  console.log(
    "💡 Tip: Add permission strings in app.json (Expo) or ios.config.json",
  );

  return config;
}

module.exports = { configureIOS };
