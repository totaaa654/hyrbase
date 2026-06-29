import type { Resume } from "./resume";

export const STATUSES = [
  "Wishlist",
  "Applied",
  "Assessment",
  "HR Interview",
  "Technical Interview",
  "Final Interview",
  "Offer",
  "Accepted",
  "Rejected",
  "Ghosted",
  "Withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Internship",
  "Contract",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_SETUPS = ["Remote", "Hybrid", "On-site"] as const;
export type WorkSetup = (typeof WORK_SETUPS)[number];

export const APPLICATION_SOURCES = [
  "LinkedIn",
  "JobStreet",
  "Indeed",
  "Glassdoor",
  "Company Website",
  "Referral",
  "Headhunter",
  "Job Fair",
  "Other",
] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SALARY_RATES = [
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
] as const;
export type SalaryRate = (typeof SALARY_RATES)[number];

export function formatSalary(
  amount: string | null,
  currency: string | null,
  rate: string | null
): string | null {
  if (!amount) return null;
  const c = currency ?? "USD";
  const r = rate ?? "Monthly";
  return `${c} ${amount} / ${r}`;
}

export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  company_logo_url: string | null;
  position: string;
  job_description: string | null;
  employment_type: EmploymentType;
  work_setup: WorkSetup;
  location: string | null;
  salary_amount: string | null;
  salary_currency: string | null;
  salary_rate: string | null;
  application_source: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  date_applied: string;
  resume_id: string | null;
  cover_letter: string | null;
  cover_letter_file_url: string | null;
  cover_letter_file_name: string | null;
  cover_letter_file_size: number | null;
  cover_letter_uploaded_at: string | null;
  notes: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryEntry {
  id: string;
  application_id: string;
  status: Status;
  notes: string | null;
  changed_at: string;
}

export interface ApplicationWithHistory extends JobApplication {
  status_history: StatusHistoryEntry[];
}

export interface ApplicationDetail extends ApplicationWithHistory {
  resume: Pick<Resume, "id" | "display_name" | "file_url"> | null;
}

export type CreateApplicationInput = Omit<
  JobApplication,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type UpdateApplicationInput = Partial<CreateApplicationInput> & {
  previousStatus?: Status;
};

export const STATUS_META: Record<
  Status,
  { color: string; dot: string; label: string }
> = {
  Wishlist: {
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
    label: "Wishlist",
  },
  Applied: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
    label: "Applied",
  },
  Assessment: {
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
    label: "Assessment",
  },
  "HR Interview": {
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    dot: "bg-orange-400",
    label: "HR Interview",
  },
  "Technical Interview": {
    color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    dot: "bg-violet-400",
    label: "Technical Interview",
  },
  "Final Interview": {
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    dot: "bg-indigo-400",
    label: "Final Interview",
  },
  Offer: {
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    dot: "bg-green-400",
    label: "Offer",
  },
  Accepted: {
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
    label: "Accepted",
  },
  Rejected: {
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400",
    label: "Rejected",
  },
  Ghosted: {
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    dot: "bg-zinc-400",
    label: "Ghosted",
  },
  Withdrawn: {
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
    label: "Withdrawn",
  },
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "company", label: "Company name" },
  { value: "date_applied", label: "Date applied" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
