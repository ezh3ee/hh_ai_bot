import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { z, ZodError } from 'zod';
import { LoggerService } from '../../logger/logger.service';

const StorageStateCookieSchema = z.object({
  name: z.string(),
  value: z.string(),
  domain: z.string(),
  path: z.string(),
  expires: z.number(),
  httpOnly: z.boolean(),
  secure: z.boolean(),
  sameSite: z.enum(['Strict', 'Lax', 'None']),
});

const StorageStateOriginSchema = z.object({
  origin: z.string(),
  localStorage: z.array(z.object({ name: z.string(), value: z.string() })),
});

const StorageStateSchema = z.object({
  cookies: z.array(StorageStateCookieSchema),
  origins: z.array(StorageStateOriginSchema),
});

type StorageState = z.infer<typeof StorageStateSchema>;

@Injectable()
export class SessionService {
  private readonly filePath: string;
  private readonly fileName: string;

  constructor(private readonly logger: LoggerService) {
    this.filePath = path.resolve(process.cwd(), 'session.json');
    this.fileName = path.basename(this.filePath);
  }

  async hasSession(): Promise<boolean> {
    return (await this.readSession()) !== null;
  }

  async readSession(): Promise<StorageState | null> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed: unknown = JSON.parse(content);
      return StorageStateSchema.parse(parsed);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }

      if (error instanceof SyntaxError) {
        this.logger.error(`[Session] Invalid JSON in ${this.fileName}`, error);
        return null;
      }

      if (error instanceof ZodError) {
        this.logger.error(
          `[Session] Invalid session structure in ${this.fileName}`,
          error,
        );
        return null;
      }

      this.logger.error(
        `[Session] Failed to read ${this.fileName}`,
        error as Error,
      );
      return null;
    }
  }

  async writeSession(state: StorageState): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    const tmpPath = `${this.filePath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
    await fs.rename(tmpPath, this.filePath);

    this.logger.log(`[Session] Saved to ${this.fileName}`);
  }

  async clearSession(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
      this.logger.log(`[Session] Removed ${this.fileName}`);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }

      this.logger.error(
        `[Session] Failed to remove ${this.fileName}`,
        error as Error,
      );
    }
  }
}
