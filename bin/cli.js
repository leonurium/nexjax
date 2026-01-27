#!/usr/bin/env node

/**
 * Nexjax CLI
 * Automatically configures iOS project settings after build
 */

const path = require('path');
const { configureIOS } = require('../lib/index');

// Get project root (where package.json is located)
const findProjectRoot = () => {
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;
  
  while (currentDir !== root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const iosPath = path.join(currentDir, 'ios');
    
    if (require('fs').existsSync(packageJsonPath) && require('fs').existsSync(iosPath)) {
      return currentDir;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return process.cwd();
};

const projectRoot = findProjectRoot();
const teamId = process.argv[2]; // Optional Team ID argument

configureIOS(projectRoot, teamId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
