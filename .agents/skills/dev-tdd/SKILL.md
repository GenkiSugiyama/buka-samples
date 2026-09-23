---
name: dev-tdd
description: Implement a TypeScript feature or fix with strict Red-Green-Refactor cycles and tracked progress. Use for production code changes in this Todo application.
---

# TDD Development

Respond in the language the user is using in the chat.

Follow `AGENTS.md` for project-wide code, lint, test, and security requirements. Before starting a multi-step implementation, read and follow `../plan-checklist/SKILL.md` and create the task checklist it defines.

## Plan behaviors

Identify the smallest observable behaviors needed for the requested outcome. Make each behavior one checklist step and one TDD cycle. Avoid speculative behaviors that the user did not request.

## Repeat for each behavior

### Red

1. Write exactly one test for the next behavior.
2. Run the focused test and confirm it fails for the expected reason:

```bash
npm test -- --run <test-file>
```

Do not write production code before observing the expected failure.

### Green

1. Write the minimum production code needed to pass the test.
2. Apply the required linter to every changed code file.
3. Run the focused test, then the full suite:

```bash
npm test -- --run <test-file>
npm test
```

### Refactor

Improve structure, naming, or clarity without adding behavior. After each refactoring edit, lint the changed code and run the relevant tests. Mark the checklist step complete only after the cycle is green.

## Test conventions

- Keep tests beside their source files, such as `src/domain/parser.ts` and `src/domain/parser.test.ts`.
- Make test names read like behavioral specifications.
- Verify one behavior per test. Multiple assertions are acceptable when they describe that one behavior.
- If a cycle is taking too long, split the behavior into smaller tests instead of adding untested production code.

## Final verification

After all cycles:

```bash
npm test
npm run lint
npm audit
```

Also run `npm run build` when the implementation or types changed. Resolve vulnerabilities of `moderate` severity or higher when possible; otherwise document the finding and remediation plan. Confirm that no secrets were added to the workspace, then complete the checklist summary.
