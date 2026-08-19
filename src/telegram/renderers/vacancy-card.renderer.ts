import type { InlineKeyboardMarkup } from '@grammyjs/types';
import { InlineKeyboard } from 'grammy';

export interface VacancyCardData {
  id: number;
  title: string;
  url: string;
  workFormat?: string;
  salary?: string;
  coverLetter?: string;
  hasQuestionnaire?: boolean;
}

export interface RenderedCard {
  text: string;
  parse_mode: 'HTML';
  reply_markup: InlineKeyboardMarkup;
}

function escapeHtml(str: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (match) => entities[match]);
}

export function renderVacancyCard(data: VacancyCardData): RenderedCard {
  const lines = [
    `<b>Найдена вакансия:</b> <a href="${escapeHtml(data.url)}">${escapeHtml(data.title)}</a>`,
  ];

  if (data.workFormat) lines.push(`📍 ${escapeHtml(data.workFormat)}`);
  if (data.salary) lines.push(`💰 ${escapeHtml(data.salary)}`);
  if (data.coverLetter) lines.push(escapeHtml(data.coverLetter));
  if (data.hasQuestionnaire)
    lines.push('⚠️ <b>Есть анкета — проверьте перед отправкой!</b>');

  const keyboard = new InlineKeyboard()
    .text('✅ Отправить', `send_${data.id}`)
    .text('❌ Отклонить', `reject_${data.id}`)
    .row()
    .text('✏️ Редактировать', `edit_${data.id}`);

  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    reply_markup: keyboard,
  };
}
