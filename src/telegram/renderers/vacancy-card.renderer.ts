import { InlineKeyboard } from 'grammy';
import type { InlineKeyboardMarkup } from '@grammyjs/types';

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

export function renderVacancyCard(data: VacancyCardData): RenderedCard {
  const lines = [
    `<b>Найдена вакансия:</b> <a href="${data.url}">${data.title}</a>`,
  ];

  if (data.workFormat) lines.push(`📍 ${data.workFormat}`);
  if (data.salary) lines.push(`💰 ${data.salary}`);
  if (data.coverLetter) lines.push(data.coverLetter);
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
    reply_markup: { inline_keyboard: keyboard.inline_keyboard },
  };
}
