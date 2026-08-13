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

## Git-воркфлоу (обязательно если говорою "залей/запушь/закоммить на github")

- Никогда не коммить в main.
- Под задачу создай ветку: git checkout -b ai/КОРОТКОЕ-ИМЯ-ЗАДАЧИ
- Перед коммитом запусти: npx tsc --noEmit -p tsconfig.build.json и npx eslint "src/**/*.ts". Если красное — чини до коммита.
- Коммить с подписью бота:
  git -c user.name="Opencode" -c user.email="opencode@agents.local" commit -m "{ЧТО СДЕЛАЛ}"
- git push -u origin ai/ИМЯ или head
- gh pr create --title "{ЧТО СДЕЛАЛ}" --body "{Коротко: что изменено и зачем}"
- НЕ нажимай merge. Жди моего решения.
- Если я говорю «почини комменты на PR N»:
  1. gh pr view N --comments
  2. gh api repos/ТВОЙ_ЛОГИН/hh-ai-bot/pulls/N/comments
     Прочитай оба вывода, исправь всё в той же ветке, закоммить, запушь. PR обновится сам.
