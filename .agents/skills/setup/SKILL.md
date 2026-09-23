---
name: setup
description: Prepare this macOS Todo project by checking development tools, guiding Google Gmail and Calendar OAuth setup, and initializing TypeScript tooling. Use for first-time setup or missing prerequisites.
---

# macOS Development Setup

Respond in the language the user is using in the chat. This skill is for local macOS setup. Follow the secret-protection rules in `AGENTS.md` and never read or display credential contents.

## 1. Check prerequisites

Run [check-prerequisites.sh](./scripts/check-prerequisites.sh). It checks:

| Tool | Minimum version | Purpose |
| --- | --- | --- |
| Node.js | 20 | TypeScript runtime |
| npm | 10 | Package management |
| Git | 2 | Version control |
| GitHub CLI (`gh`) | 2 | Repository and PR operations |

Report the result. If a tool is missing or outdated, explain why it is needed and request permission before installing it with Homebrew:

```bash
brew install node git gh
```

Install only the missing tools the user approves.

## 2. Configure Google APIs

Check whether `~/.todo-app/credentials.json` exists without reading it. If it exists, report that fact and continue to project initialization.

Otherwise guide the user interactively, waiting for confirmation after each stage:

1. Open Google Cloud Console and create or select a project.
2. Enable Gmail API and Google Calendar API.
3. Configure the OAuth consent screen for an external test application and add the user's Gmail address as a test user.
4. Create an OAuth client ID with application type **Desktop app**.
5. Download the JSON credential file and ask the user for its path.

Google Cloud Console changes over time. If the current screen differs from these steps, inspect a screenshot or consult current official Google documentation.

## 3. Store credentials safely

Resolve the downloaded file to one explicit absolute path. Do not use wildcards and do not inspect its contents. Ask for confirmation immediately before moving it outside the workspace:

```bash
mkdir -p ~/.todo-app
mv "<absolute-path>" ~/.todo-app/credentials.json
```

After the move, verify only that the destination exists. The application should use these paths:

```typescript
import os from "node:os";
import path from "node:path";

const credentialDirectory = path.join(os.homedir(), ".todo-app");
const credentialsPath = path.join(credentialDirectory, "credentials.json");
const tokenPath = path.join(credentialDirectory, "token.json");
```

## 4. Initialize project tooling

If `package.json` is missing, run `npm init -y`. Request permission before installing dependencies:

```bash
npm install --save-dev typescript vitest eslint @eslint/js typescript-eslint eslint-plugin-security prettier @types/node
npm install googleapis
```

Then run:

```bash
node .agents/skills/setup/scripts/initialize-project.mjs
```

The initializer preserves existing configuration files, but updates the standard scripts in `package.json`.

## 5. Verify

Run the prerequisite check again, verify the credential file exists without reading it, and run:

```bash
npm run build
npm test
npm run lint
```

Report each result and any unresolved blocker. Suggest `$plan-checklist` to plan the first feature or `$dev-tdd` to implement it.
