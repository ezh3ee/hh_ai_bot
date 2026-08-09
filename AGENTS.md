## Repository exploration rules

- Never search or read files inside node_modules, dist, .git or coverage.
- Do not inspect generated files unless explicitly required.
- Prefer source files under src/.
- Inspect package.json before searching dependency internals.
- Only inspect dependency type declarations when the public API cannot be inferred from package.json or existing project usage.

## Repository exploration

- Do not read or search node_modules/, dist/, .git/ or other generated directories.
- Prefer source files under src/.
- Do not inspect dependency internals unless the task cannot be completed using the public API or existing project usage.
- When investigating a task, first inspect only files directly related to it.
- Avoid broad repository-wide searches unless necessary.
- DO not read .env files