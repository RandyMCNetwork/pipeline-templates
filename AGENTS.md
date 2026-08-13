# Project Instructions & Guidelines

## Core Principles

### Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them rather than picking silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop and name what is confusing.

### Simplicity First
- Implement the minimum code that solves the problem. Nothing speculative.
- Avoid features, single-use abstractions, or flexibility beyond what was requested.
- Avoid error handling for impossible scenarios.
- If a solution is overcomplicated, rewrite it simply.

### Surgical Changes
- Touch only what you must. Clean up only your own mess.
- Match existing code style and conventions.
- Remove imports, variables, and functions introduced by your changes that became unused.
- Mention unrelated dead code if noticed, but do not delete it unless asked.

### Goal-Driven Execution
- Define clear success criteria and verify changes before finishing.
- For multi-step tasks, outline a concise step-by-step plan with explicit verification steps.

---

## Project Architecture & Core Systems

### Philosophy
- Code must be performant, thread-safe, cleanly decoupled, and maintainable.
- Respect the target project's module boundaries and architecture.
- Keep APIs minimal and separate interfaces from implementations.
- Keep persistence centralized where the project architecture requires it.

### Minecraft & Bukkit Rules
- Use the project's established player abstractions instead of raw Bukkit `Player` objects for persistent state.
- Never access or mutate player data before the project's synchronization/readiness event has fired.
- Never perform synchronous database or network I/O on the Minecraft main thread.
- Use the main thread for Bukkit API operations and asynchronous execution for database/network work.
- Avoid registering to `PlayerMoveEvent` for recurring logic; use tick schedulers where appropriate.
- Always respect event cancellation and use appropriate priorities such as `ignoreCancelled`, `MONITOR`, or `HIGHEST`.
- Prefer the project's custom inventory, item, crafting, and utility abstractions over vanilla Bukkit APIs.
- Ensure all Bukkit API usage is thread-safe and main-thread compliant.

### Testing & Mocks
- Use the project's existing test framework and mocks.
- For Bukkit plugins, use MockBukkit and Mockito where appropriate.
- Cover edge cases and error paths without adding speculative behavior.

---

## Code Review & Style Guidelines

### Java Imports & Formatting
- Always use direct imports at the top of Java files.
- Never use wildcard imports such as `import java.util.*;`.
- Keep the project's configured Paper/Minecraft API version unless an explicit change is approved.

### Clean Code & Refactoring
- Finish testing a production class before moving to another class or ending the task.
- Do not bypass lint or compiler findings with `@SuppressWarnings`, `NOPMD`, or equivalent suppressions.
- Extract repeated test setup and small duplications into focused utility or fixture classes.
- When a method appears unnecessary, contradictory, unreachable, or inexplicably complex, explain the concrete concern before changing its behavior.
- Safe non-semantic cleanup and testable method extraction remain allowed.

## Repowise-first codebase context

This repository is indexed in Repowise as `pipeline-templates`. Treat its Repowise index as the primary source of codebase context.

- Start repository questions with Repowise: use `get_overview`, `get_answer`, `get_context`, `get_symbol`, `get_risk`, or `get_why`.
- When a tool supports it, explicitly query `repo="pipeline-templates"`.
- Use `Read`, `Grep`, and `Glob` only to verify code before editing or when Repowise cannot provide the required detail.
- Do not re-read source ranges returned with `verified: true`, unless Repowise reports stale or approximate bounds.
- Before editing, use `get_risk` for blast radius and tests; use `get_why` before changing an established pattern or architectural decision.

---

## Verification

- Run the relevant tests, Checkstyle, PMD, and JaCoCo (or the project's equivalent quality tools) after each completed coverage block.
- Respect the coverage thresholds configured by the target project.
- Create frequent, logically scoped commits, but do not push unless explicitly requested.
