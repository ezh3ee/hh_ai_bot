import { z } from 'zod';

const ProjectSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),
  type: z.string().min(1),
  url: z.url().nullable(),
  stack: z.array(z.string()).min(1),
  description: z.string().min(1),
});

const CandidateSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  desired_positions: z.array(z.string()).min(1),
  salary_expectation: z.string().min(1),
  work_format: z.array(z.enum(['REMOTE', 'HYBRID', 'ON_SITE'])).min(1),
  excluded_positions: z.array(z.string()).optional(),
  projects: z.record(z.string(), ProjectSchema).optional(),
  experience_summary: z.string().min(1),
});

const HhSchema = z.object({
  resume_name: z.string().min(1),
  search_queries: z.array(z.string()).min(1),
  areas: z.array(z.string()).min(1),
  stop_words: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
});

const AiInstructionsSchema = z.object({
  is_suitable: z.string().min(1),
  cover_letter: z.string().min(1),
});

export const SettingsSchema = z.object({
  candidate: CandidateSchema,
  hh: HhSchema,
  ai_instructions: AiInstructionsSchema,
});

export type SettingsConfig = z.infer<typeof SettingsSchema>;
export type CandidateConfig = z.infer<typeof CandidateSchema>;
export type HhConfig = z.infer<typeof HhSchema>;
export type AiInstructionsConfig = z.infer<typeof AiInstructionsSchema>;
export type ProjectConfig = z.infer<typeof ProjectSchema>;
