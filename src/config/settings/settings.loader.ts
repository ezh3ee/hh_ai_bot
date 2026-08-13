import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { ZodError } from 'zod';
import { SettingsSchema, SettingsConfig } from './settings.schema';

export function settingsLoader(): SettingsConfig {
  const filePath = path.resolve(process.cwd(), 'settings.yml');

  if (!fs.existsSync(filePath)) {
    throw new Error(
      '[Settings] Файл settings.yml не найден в корне проекта. ' +
        'Скопируйте settings-example.yml в settings.yml и заполните его.',
    );
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `[Settings] Не удалось прочитать файл settings.yml: ${(error as Error).message}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = yaml.parse(content);
  } catch (error) {
    throw new Error(
      `[Settings] Неверный YAML синтаксис в settings.yml: ${(error as Error).message}`,
    );
  }

  try {
    return SettingsSchema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new Error(`[Settings] Ошибка валидации settings.yml: ${issues}`);
    }
    throw error;
  }
}
