import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import telegramConfig from '../../config/telegram.config';

// TODO: перенести state в Redis в будущем

type ActionType = 'SEND' | 'REJECT' | 'EDIT';

interface ActionResult {
  type: ActionType;
  vacancyId: number | null;
}

interface Pending<T> {
  resolve: (v: T) => void;
  reject: (e: Error) => void;
  timeout: NodeJS.Timeout;
}

@Injectable()
export class TelegramWaitService implements OnModuleDestroy {
  private readonly actionWaiters = new Map<string, Pending<ActionResult>>();
  private readonly textWaiters = new Map<string, Pending<string>>();

  constructor(
    @Inject(telegramConfig.KEY)
    private readonly config: ConfigType<typeof telegramConfig>,
  ) {}

  private clearExistingWait(chatId: string): void {
    const activeAction = this.actionWaiters.get(chatId);
    if (activeAction) {
      clearTimeout(activeAction.timeout);
      this.actionWaiters.delete(chatId);
    }

    const activeText = this.textWaiters.get(chatId);
    if (activeText) {
      clearTimeout(activeText.timeout);
      this.textWaiters.delete(chatId);
    }
  }

  waitForAction(
    chatId: string,
  ): Promise<{ type: 'SEND' | 'REJECT' | 'EDIT'; vacancyId: number | null }> {
    this.clearExistingWait(chatId);

    return new Promise<{
      type: 'SEND' | 'REJECT' | 'EDIT';
      vacancyId: number | null;
    }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.actionWaiters.delete(chatId);
        reject(
          new Error(
            `Timeout waiting for action (${this.config.TELEGRAM_WAIT_TIMEOUT_MS}ms)`,
          ),
        );
      }, this.config.TELEGRAM_WAIT_TIMEOUT_MS);

      this.actionWaiters.set(chatId, { resolve, reject, timeout });
    });
  }

  waitForText(chatId: string): Promise<string> {
    this.clearExistingWait(chatId);

    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.textWaiters.delete(chatId);
        reject(
          new Error(
            `Timeout waiting for text (${this.config.TELEGRAM_WAIT_TIMEOUT_MS}ms)`,
          ),
        );
      }, this.config.TELEGRAM_WAIT_TIMEOUT_MS);

      this.textWaiters.set(chatId, { resolve, reject, timeout });
    });
  }

  resolveAction(
    chatId: string,
    action: { type: 'SEND' | 'REJECT' | 'EDIT'; vacancyId: number | null },
  ): void {
    const pending = this.actionWaiters.get(chatId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.actionWaiters.delete(chatId);
      pending.resolve(action);
    }
  }

  resolveText(chatId: string, text: string): void {
    const pending = this.textWaiters.get(chatId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.textWaiters.delete(chatId);
      pending.resolve(text);
    }
  }

  onModuleDestroy(): void {
    for (const [, pending] of this.actionWaiters) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Service shutting down'));
    }
    for (const [, pending] of this.textWaiters) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Service shutting down'));
    }
    this.actionWaiters.clear();
    this.textWaiters.clear();
  }
}

interface Pending<T> {
  resolve: (v: T) => void;
  reject: (e: Error) => void;
  timeout: NodeJS.Timeout;
}

interface ActionResult {
  type: 'SEND' | 'REJECT' | 'EDIT';
  vacancyId: number | null;
}
