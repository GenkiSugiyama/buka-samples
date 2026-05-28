---
name: setup
description: "Check and install prerequisites for the Todo app project. Use when setting up the development environment, when a user first opens the workspace, when troubleshooting missing tools, or when the user mentions setup, install, prerequisites, or environment."
argument-hint: "Run environment setup check"
---

# Setup — Development Environment

> **Default language: Japanese (日本語)**
> This skill is primarily used by Japanese-speaking participants.
> At the very beginning of the setup, ask the user to confirm their preferred language.
> Example: greet in Japanese and offer English as an alternative.
> Use the confirmed language for all subsequent communication.

This skill checks whether all required tools are installed, guides the user through Google API setup interactively, and initializes the project.

## Prerequisites

| Tool | Minimum Version | Purpose | Required |
|------|----------------|---------|----------|
| Node.js | v20+ | TypeScript runtime | Yes |
| npm | v10+ | Package manager (bundled with Node.js) | Yes |
| Git | v2+ | Version control | Yes |
| GitHub CLI (`gh`) | v2+ | PR creation and repo management | Yes |

## Procedure

### Phase 0 — VS Code Configuration

Before anything else, help the user configure VS Code for a smooth experience.

#### Step 0a — Confirm AI model

Check with the user that they have selected **Claude Opus 4.6** or later in the Copilot chat model selector. If they're unsure, guide them to click the model dropdown at the bottom of the chat input and select Claude Opus 4.6. Mention that there is a screenshot in README.md for reference.

#### Step 0b — Configure Permission Level

By default, Copilot asks for confirmation before every action (running commands, editing files, etc.). For a smoother experience, guide the user to change the permission level.

Explain the three levels:

| Level | Description |
| --- | --- |
| **Default Approvals** | Only safe operations are auto-approved (default) |
| **Bypass Approvals** | All tool operations are auto-approved. No confirmation dialogs |
| **Autopilot** (Preview) | All auto-approved + auto-responds to questions. Fully autonomous |

Recommend **"Bypass Approvals"** for this guided learning experience, but explain the safety trade-off before the user changes it:

- With Bypass Approvals, Copilot can run terminal commands and edit files without asking for confirmation each time.
- Use it only in this trusted learning workspace, and only while the user is comfortable accepting responsibility for those actions.
- The user should keep an eye on the chat and terminal output, and should never paste secrets or credentials into the chat.
- When setup or the learning session is finished, tell the user to switch back to **Default Approvals**.

Do **not** recommend Autopilot for this experience. Autopilot would answer questions automatically without letting the user participate in the conversation, which is not ideal for a learning experience.

Tell the user to look for the permission picker near the chat input area, close to the "Agent" dropdown.

Wait for the user to confirm before proceeding.

### Phase 1 — Tool Check

#### Step 1 — Detect the OS

Determine whether the user is on Windows or macOS/Linux. Use the terminal environment to detect this:
- Windows: PowerShell is available, `$env:OS` is `Windows_NT`
- macOS/Linux: Bash/Zsh is available

#### Step 2 — Run the prerequisite check

Run the appropriate script for the user's OS:

- **Windows**: [check-prerequisites.ps1](./scripts/check-prerequisites.ps1)
- **macOS/Linux**: [check-prerequisites.sh](./scripts/check-prerequisites.sh)

The script will output a table showing each tool, its status (installed/missing), and its version.

#### Step 3 — Report results

Present the results clearly to the user in their language. Example:

```text
✅ Node.js v22.1.0
✅ npm v10.8.0
✅ Git v2.44.0
❌ GitHub CLI (gh) — not found
```

#### Step 4 — Offer to install missing tools

If any tools are missing, explain what each one does and ask the user for permission before installing.

Provide the install commands grouped by OS:

**Windows (winget)**:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
```

**macOS (Homebrew)**:

```bash
brew install node git gh
```

**Linux (apt)**:

```bash
sudo apt update && sudo apt install -y nodejs npm git
# gh: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

Only install after the user confirms.

### Phase 2 — Google API Setup (Interactive Guide)

This phase guides the user step-by-step through configuring Google Cloud for Gmail and Calendar access. The user does the clicks in their browser; the agent tells them exactly what to do.

#### Step 5 — Check for existing credentials

Check if `~/.todo-app/credentials.json` already exists:

**Windows**:

```powershell
Test-Path "$env:USERPROFILE\.todo-app\credentials.json"
```

**macOS/Linux**:

```bash
test -f ~/.todo-app/credentials.json && echo "exists" || echo "not found"
```

If the file exists, inform the user and skip to Phase 3.

#### Step 6 — Guide: Create a Google Cloud project

Tell the user:

> Please open your browser and go to:
> https://console.cloud.google.com/
>
> 1. Sign in with your Google account
> 2. Click "Select a project" at the top → "New Project"
> 3. Enter a project name (anything is fine, e.g. `todo-app`)
> 4. Click "Create"
>
> Let me know when you're done!

Wait for confirmation before proceeding.

#### Step 7 — Guide: Enable Gmail API and Calendar API

Tell the user:

> Now let's enable the APIs your app needs.
>
> 1. In the left menu, go to "APIs & Services" → "Library"
> 2. Search for **Gmail API** and click "Enable"
> 3. Go back to the Library, search for **Google Calendar API** and click "Enable"
>
> Let me know when both are enabled!

Wait for confirmation.

#### Step 8 — Guide: Configure OAuth consent screen

Tell the user:

> Next, we need to set up the permission screen that Google shows when your app asks for access.
>
> 1. Go to "APIs & Services" → "OAuth consent screen"
> 2. Select "External" and click "Create"
> 3. Fill in:
>    - App name: anything (e.g. `Todo App`)
>    - User support email: your email
>    - Developer contact email: your email
> 4. Click "Save and Continue"
> 5. On the "Scopes" page, just click "Save and Continue" (we'll set these in code)
> 6. On "Test users", click "Add users" and add your Gmail address
> 7. Click "Save and Continue", then "Back to Dashboard"
>
> Let me know when you're done!

Wait for confirmation.

#### Step 9 — Guide: Create OAuth credentials

Tell the user:

> Almost there! Now we create the credentials your app will use.
>
> 1. Go to "APIs & Services" → "Credentials"
> 2. Click "Create Credentials" → "OAuth client ID"
> 3. Application type: **Desktop app** (this is simpler than Web — no redirect URI needed)
> 4. Name: anything (e.g. `Todo App Desktop`)
> 5. Click "Create"
> 6. A dialog will appear — click **"Download JSON"**
> 7. Save the file somewhere you can find it (e.g. your Downloads folder)
>
> Tell me where you saved the file, or just tell me the filename!

Wait for the user to provide the file path.

#### Step 10 — Place credentials in the safe location

Once the user tells you where the file is, move it to `~/.todo-app/credentials.json`.

Before running the move command, normalize the user's answer to an absolute path:

- If the user provides only a filename, look for that file in their Downloads folder.
- If the user provides a relative path, resolve it from the current directory.
- Do not use wildcards, and do not read or display the file contents.

**Windows**:

```powershell
$sourcePath = (Resolve-Path -LiteralPath "<absolute-path-to-downloaded-json>").Path
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.todo-app"
Move-Item -LiteralPath $sourcePath -Destination "$env:USERPROFILE\.todo-app\credentials.json" -Force
```

**macOS/Linux**:

```bash
source_path="<absolute-path-to-downloaded-json>"
mkdir -p ~/.todo-app
mv "$source_path" ~/.todo-app/credentials.json
```

**IMPORTANT**: Do NOT read or display the contents of the credentials file. Move it out of the workspace so the downloaded copy is not accidentally committed.

After moving, confirm to the user:

> ✅ Credentials have been saved to `~/.todo-app/credentials.json`.
> This is outside your project folder, so it will never be sent to the AI or committed to Git.

### Phase 3 — Project Initialization

#### Step 11 — Initialize the TypeScript project tooling

After all tools are present and credentials are configured, make sure `package.json` exists. If it does not exist yet, create it:

```bash
npm init -y
```

Then install the recommended dependencies:

```bash
npm install --save-dev typescript vitest eslint @eslint/js typescript-eslint eslint-plugin-security prettier @types/node
npm install googleapis
```

Then initialize the minimal project tooling:

```bash
node .github/skills/setup/scripts/initialize-project.mjs
```

This creates or updates:

- `package.json` with `build`, `test`, `lint`, `lint:fix`, and `format` scripts
- `tsconfig.json` for strict TypeScript on Node.js ES Modules
- `eslint.config.js` with TypeScript ESLint and `eslint-plugin-security`
- `vitest.config.ts`
- `.prettierrc.json` and `.prettierignore`
- `src/index.ts`, `src/domain/`, and `src/services/` starter locations

Do not skip this step. The later development workflow expects `npm run build`, `npm test`, `npm run lint`, `npm run lint:fix`, and `npm run format` to work.

#### Step 12 — Final verification

Run the prerequisite check script one more time to confirm all tools are present, verify `~/.todo-app/credentials.json` exists, and verify the generated project tooling:

```bash
npm run build
npm test
npm run lint
```

Present a final summary:

```text
✅ Node.js v22.1.0
✅ npm v10.8.0
✅ Git v2.44.0
✅ GitHub CLI v2.50.0
✅ Google API credentials configured
✅ TypeScript project tooling initialized
✅ Build, test, and lint commands verified

You're all set! Try /plan-checklist to start planning, or /dev-tdd to start building.
```
