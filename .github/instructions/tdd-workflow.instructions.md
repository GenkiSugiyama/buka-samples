---
description: "Use when developing code with Test-Driven Development. Covers the Red-Green-Refactor cycle, test structure, and TDD discipline for TypeScript with Vitest."
applyTo: src/**/*.ts, src/**/*.test.ts, tests/**/*.ts
---

# TDD Workflow

> Respond in the language the user is using in the chat.

This instruction defines the standard TDD (Test-Driven Development) process for this project.
It is referenced by the `/dev-tdd` prompt and applies to all TypeScript source and test files.

## The Red-Green-Refactor Cycle

Every piece of functionality is built through this cycle. No exceptions.

### 1. Red — Write a Failing Test

- Write exactly ONE test that describes the next small piece of behavior you need.
- Run the test and confirm it **fails** for the expected reason.
- The failure message should clearly describe what is missing.
- Do NOT write any production code yet.

```bash
npm test -- --run <test-file>
```

### 2. Green — Make It Pass

- Write the **minimum** production code needed to make the failing test pass.
- Resist the urge to write more than necessary — no "while I'm here" additions.
- Run the test again and confirm it **passes**.
- Run the full test suite to ensure nothing else broke:

```bash
npm test
```

### 3. Refactor — Clean Up

- Improve the code's structure, naming, or clarity without changing behavior.
- Run all tests after each refactoring change to confirm everything still passes.
- Apply lint:

```bash
npx eslint --fix <changed-files>
```

### Then Repeat

Pick the next behavior and start a new Red-Green-Refactor cycle.

## Test File Conventions

- Test files live alongside source files: `src/domain/parser.ts` → `src/domain/parser.test.ts`
- Use descriptive test names that read like specifications:

```typescript
describe("extractEventsFromEmail", () => {
  it("should extract a single event with date, time, and title", () => { ... });
  it("should return an empty array when no events are found", () => { ... });
  it("should handle multiple events in one email", () => { ... });
});
```

## Guiding Principles

- **Small steps**: Each cycle should take minutes, not hours. If you are stuck, the step is too big — break it down.
- **Trust the tests**: If all tests pass, the code works. If a test is missing, write it before adding code.
- **One behavior per test**: Each test should verify exactly one thing. Multiple assertions are fine if they all describe the same behavior.
- **No production code without a test**: Every line of production code exists because a test required it.

## Vulnerability Check

After completing a feature (a group of TDD cycles), run:

```bash
npm audit
npx eslint --ext .ts src/
```

Address any `moderate` or higher severity issues before moving on.
