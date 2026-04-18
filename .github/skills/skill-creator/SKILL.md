---
name: skill-creator
description: "Create new skills, modify and improve existing skills, and measure skill quality. Use when users want to create a skill from scratch, edit or refine an existing skill, test a skill with sample prompts, or optimize a skill's description for better triggering accuracy."
argument-hint: "Describe the skill you want to create or improve"
---

# Skill Creator

> Respond in the language the user is using in the chat.

A skill for creating new skills and iteratively improving them — adapted for VS Code Copilot from the [anthropics/skills](https://github.com/anthropics/skills) repository pattern.

## Overview

The process of creating a skill:

1. Decide what the skill should do and roughly how
2. Write a draft of the SKILL.md
3. Create a few test prompts and try them
4. Review the results with the user
5. Improve the skill based on feedback
6. Repeat until the user is satisfied

Your job is to figure out where the user is in this process and help them progress through these stages.

## Communicating with the User

This skill may be used by people with varying levels of technical familiarity. Pay attention to context cues:
- If the user uses casual language, explain technical terms briefly
- If the user is clearly technical, you can use standard jargon freely
- When in doubt, briefly explain terms like "frontmatter", "trigger", "description field"

## Creating a Skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture.

1. What should this skill enable the agent to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases to verify the skill works?

### Interview and Research

Ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Check the workspace for existing patterns to follow.

### Write the SKILL.md

Based on the user interview, create the skill folder and file:

**Location**: `.github/skills/<skill-name>/SKILL.md`

**Required structure**:
```yaml
---
name: skill-name              # 1-64 chars, lowercase + hyphens, must match folder
description: 'What it does and when to use it. Max 1024 chars.'
argument-hint: 'Optional hint for slash command usage'
---
```

**Body** should include:
- What the skill accomplishes
- When to use it (triggers and use cases)
- Step-by-step procedures
- References to resources: `[script](./scripts/test.js)`

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md           # Required (name must match folder)
├── scripts/           # Executable code for deterministic tasks
├── references/        # Docs loaded into context as needed
└── assets/            # Templates, boilerplate files
```

#### Key Principles

1. **Progressive Disclosure**: Keep SKILL.md under 500 lines. Reference additional files for details.
2. **Keyword-rich descriptions**: Include trigger words so the agent knows when to load the skill. Be slightly "pushy" — describe when the skill should be used even if the user doesn't explicitly ask.
3. **Explain the why**: Rather than rigid MUST/NEVER rules, explain reasoning so the agent can generalize.
4. **Self-contained**: Include all procedural knowledge needed to complete the task.
5. **Relative paths**: Always use `./` for skill resources.

#### Writing Patterns

Use imperative form in instructions. Include examples:

```markdown
## Commit message format
**Example:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Test Cases

After writing the skill draft, create 2-3 realistic test prompts:

1. Share the test prompts with the user for confirmation
2. Run each test prompt to verify the skill works
3. Review results with the user
4. Improve the skill based on feedback

### Iterate

Keep improving until:
- The user says they're happy
- The feedback is all positive
- The skill handles the intended use cases well

## Description Optimization

The `description` field is how the agent decides whether to load a skill. Tips:

- Include both what the skill does AND specific contexts for when to use it
- Include alternative phrasings a user might use
- Test with realistic prompts to see if the skill triggers correctly
- Complex, multi-step queries trigger skills more reliably than simple one-liners
