---
name: Generated client headers compatibility
description: A TypeScript lib target can omit Headers iterable helpers even when browser runtime supports them.
---

The generated API client should normalize `Headers` with `forEach` rather than relying on `Headers.entries()` when the workspace TypeScript lib target does not include `dom.iterable`.

**Why:** OpenAPI codegen generated `Headers.entries()` calls that failed the shared library typecheck even though the browser implementation supported the method.

**How to apply:** After API codegen, keep the generated client compatible with the repository's declared TypeScript libs and rerun `pnpm run typecheck:libs`.