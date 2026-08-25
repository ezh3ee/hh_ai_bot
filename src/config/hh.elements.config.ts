import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';
import { settingsLoader } from './loader/yml-file.loader';
import { formatZodIssues } from './validation/format-zod-error';

const hhElementsConfigSchema = z.object({
  HH_PROFILE_ICON_DESKTOP: z.string(),
  HH_PROFILE_ICON_MOBILE: z.string(),
  HH_LIST_PAGINATION_BLOCK: z.string(),
  HH_LIST_TOTAL_PAGES_NUMERIC: z.string(),
  HH_LIST_TOTAL_PAGES_ARROW: z.string(),
  HH_LIST_VACANCIES_LIST: z.string(),
  HH_LIST_VACANCY_ITEM: z.string(),
  HH_LIST_VACANCY_LINK: z.string(),
  HH_LIST_VACANCY_TITLE: z.string(),
  HH_LIST_VACANCY_SNIPPET_DESCRIPTION: z.string(),
  HH_LIST_VACANCY_SNIPPET_REQUIREMENTS: z.string(),
  HH_DETAILED_COMPANY_NAME: z.string(),
  HH_DETAILED_VACANCY_TITLE: z.string(),
  HH_DETAILED_SALARY: z.string(),
  HH_DETAILED_EXPERIENCE: z.string(),
  HH_DETAILED_VACANCY_LOCATION: z.string(),
  HH_DETAILED_WORK_FORMAT: z.string(),
  HH_DETAILED_VACANCY_DESCRIPTION: z.string(),
  HH_IS_ADDITIONAL_FORM: z.string(),
  HH_RESUME_DROPDOWN_SELECTOR: z.string(),
  HH_RESUME_DROPDOWN_LIST: z.string(),
  HH_RESUME_DROPDOWN_LIST_XS: z.string(),
  HH_RESUME_DROPDOWN_NAME: z.string(),
  HH_RESUME_DROPDOWN_NAME_XS: z.string(),
  HH_APPLY_FORM_COVER_LETTER_TRIGGER: z.string(),
  HH_APPLY_FORM_TEXTAREA: z.string(),
  HH_APPLY_FORM_SUBMIT_BUTTON: z.string(),
});

export type HhElementsConfig = z.infer<typeof hhElementsConfigSchema>;

export default registerAs('hhelements', (): HhElementsConfig => {
  const ymlData = settingsLoader('elements');
  let data: HhElementsConfig;

  try {
    data = hhElementsConfigSchema.parse(ymlData);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        `[HHELEMENTS Config]: Validation failed - ${formatZodIssues(error)}`,
      );
    }

    throw error;
  }

  return data;
});
