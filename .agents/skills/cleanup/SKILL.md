---
name: cleanup
description: Review root-level checklist files and remove completed ones with confirmation. Use when the user asks to clean up or remove finished task checklists.
---

# Checklist Cleanup

Respond in the language the user is using in the chat.

Read `../plan-checklist/SKILL.md` before interpreting checklist state.

1. List project-root files matching `checklist-*.md`.
2. Read each file and report its status:
   - Done when every step is complete or skipped.
   - In progress when any step remains incomplete.
3. Show a concise summary including completed counts for in-progress files.
4. Ask whether the user wants the completed files deleted or kept.
5. Delete only the completed files explicitly approved by the user.

Never delete an in-progress checklist. Treat deletion as permanent unless a recoverable trash operation is available, and state what was removed.
