---
name: plan-checklist
description: Create and maintain a root-level checklist for a multi-step project task. Use before implementation when work needs several verifiable steps, or when the user asks for a tracked plan.
---

# Plan Checklist

Respond in the language the user is using in the chat.

Use a checklist to make multi-step work inspectable. Do not create one for a simple answer or a single read-only check.

## Create the checklist

1. Understand the requested outcome. Ask only when a missing decision would materially change the result.
2. Break the work into small, verifiable steps.
3. Create `checklist-<task-name>.md` in the project root using this structure:

```markdown
# Task: <descriptive title>
Created: <date>

## Steps

- [ ] Step 1: <clear, actionable description>
- [ ] Step 2: <clear, actionable description>

## Notes

<decisions, assumptions, or blockers>
```
## Maintain it during work

- Use one checklist per logical task.
- Keep each step small enough for one focused effort.
- Mark a step `[x]` immediately after it is complete.
- Never remove a planned step. Mark an unnecessary step `[~] Skipped: <reason>`.
- Record decisions, surprises, and blockers in `Notes` as they arise.
- Do not continue into implementation when the user authorized planning only.

When all steps are complete or skipped, append:

```markdown
## Summary

<one-line outcome>
```
