export interface RawApplication {
  id: string;
  company_name: string;
  position: string;
  status: string;
  date_applied: string;
  resume_id: string | null;
  job_description: string | null;
  salary_amount: string | null;
  salary_currency: string | null;
  salary_rate: string | null;
  employment_type: string | null;
  work_setup: string | null;
  updated_at: string;
}

export interface RawAnalysis {
  application_id: string;
  resume_id: string | null;
  ats_score: number;
  resume_match: number;
}

export interface RawResume {
  id: string;
  display_name: string;
}

export interface AnalyticsPayload {
  applications: RawApplication[];
  analyses: RawAnalysis[];
  resumes: RawResume[];
  weeklyGoal: number;
}

export type EventType =
  | "application" | "interview" | "assessment" | "hr_call"
  | "follow_up" | "offer" | "deadline" | "note";

export type EventPriority = "low" | "medium" | "high";

export interface CalendarEvent {
  id: string;
  application_id: string | null;
  title: string;
  description: string | null;
  event_type: EventType;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  priority: EventPriority;
  completed: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
  application?: {
    company_name: string;
    position: string;
    status: string;
  } | null;
}

export interface CreateEventInput {
  application_id?: string | null;
  title: string;
  description?: string | null;
  event_type: EventType;
  start_time: string;
  end_time?: string | null;
  all_day: boolean;
  priority: EventPriority;
  color?: string | null;
}
