export interface Vacancy {
  id: string;
  title: string;
  company: string;
  description: string;
  url: string;
  salary?: string;
  location?: string;
}

export interface Candidate {
  name: string;
  desired_positions: string[];
  salary_expectation: string;
  work_format: string[];
  experience_summary: string;
  projects?: Record<
    string,
    {
      name: string;
      role: string;
      period: string;
      type: string;
      url?: string | null;
      stack: string[];
      description: string;
    }
  >;
}
