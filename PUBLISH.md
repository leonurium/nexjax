# Publishing Guide

## Automated Publishing (Recommended)

This project uses GitHub Actions to automatically publish to npm when you create a new release tag.

### Setup (One-time)

1. **Create an npm access token:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Create a new "Automation" token (or "Publish" token)
   - Copy the token

2. **Add the token to GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### Publishing a New Version

1. **Update the version in package.json:**
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Push the version commit and create a tag:**
   ```bash
   git push
   git push --tags
   ```

   Or create a tag manually:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **The GitHub workflow will automatically:**
   - Detect the new tag (must start with `v`)
   - Extract the version number
   - Update package.json version
   - Publish to npm
   - Verify the publication

### Manual Workflow Trigger

You can also manually trigger the workflow:
- Go to Actions tab in GitHub
- Select "Publish to npm" workflow
- Click "Run workflow"
- The workflow will use the current version from package.json

## Local Development

To test locally in your React Native project:

```bash
# From nexjax directory
npm link

# From your React Native project
npm link nexjax

# Then use it
npx nexjax YOUR_TEAM_ID
```

## Manual Publishing (Alternative)

If you prefer to publish manually or need to publish locally:

### 1. Update version

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 2. Publish

```bash
npm publish
```

### 3. Verify

```bash
npm view nexjax
```

## Using from npm

After publishing, users can install:

```bash
npm install --save-dev nexjax
```

Or use with npx:

```bash
npx nexjax YOUR_TEAM_ID
```

## Package Structure

```
nexjax/
├── bin/
│   └── cli.js              # CLI entry point
├── lib/
│   └── index.js            # Main logic
├── package.json
├── README.md
├── LICENSE
├── EXAMPLE.md
└── .gitignore
```

## Files Included in npm Package

Only these files are published (defined in package.json `files` field):
- `bin/` - CLI scripts
- `lib/` - Main library code
- `README.md` - Documentation
- `LICENSE` - License file

## Testing Before Publish

1. Test locally with `npm link`
2. Test in a fresh React Native project
3. Test with Expo project
4. Test with bare React Native project
5. Verify all features work
