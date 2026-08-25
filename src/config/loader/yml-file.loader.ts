import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export function settingsLoader(filename: string) {
  const filePath = path.resolve(process.cwd(), `${filename}.yml`);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `[Settings] Файл ${filename}.yml не найден в корне проекта. ` +
        `Скопируйте ${filename}-example.yml в ${filename}.yml и заполните его.`,
    );
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `[Settings] Не удалось прочитать файл ${filename}.yml: ${error.message}`,
      );
    }
    throw new Error(
      `[Settings] Не удалось прочитать файл ${filename}.yml: ${String(error)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = yaml.parse(content);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `[Settings] Неверный YAML синтаксис в файле ${filename}.yml: ${error.message}`,
      );
    }
    throw new Error(
      `[Settings] Неверный YAML синтаксис в файле ${filename}.yml: ${String(error)}`,
    );
  }

  return parsed;
}
