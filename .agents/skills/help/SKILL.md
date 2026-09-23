---
name: help
description: Diagnose development environment, code, Codex, UI, or Google API problems in this Todo project. Use when the user is stuck, reports an error, or says the documented flow does not match reality.
---

# Development Help

Respond in the language the user is using in the chat.

Diagnose before changing code. Ask for an exact error message or screenshot only when the existing context and read-only checks are insufficient.

## Classify the problem

- **Environment:** missing tools, version mismatches, or npm failures. Use `$setup` checks when relevant.
- **Code:** test, TypeScript, build, or lint failures. Reproduce the failure and locate its source. Implement a fix only when the user asks for one.
- **UI or settings:** the current interface differs from documentation. Inspect the screenshot and consult current official documentation rather than insisting on stale steps.
- **Codex behavior:** stalled work, loops, or incorrect output. Inspect the current files, tests, and active instructions; reduce the task scope if needed.
- **Google API:** OAuth, API enablement, or credential problems. Check only whether `~/.todo-app/credentials.json` exists; never read or print it.

Give a clear next action and verify the observed problem is resolved when possible. For a multi-step fix, use `$plan-checklist`. Preserve the secret-protection requirements in `AGENTS.md` throughout diagnosis.
