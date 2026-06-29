"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, PenLine, Sparkles, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResumeSelector } from "@/components/resumes/resume-selector";
import { createApplication, updateApplication } from "@/app/(dashboard)/applications/actions";
import {
  STATUSES,
  EMPLOYMENT_TYPES,
  WORK_SETUPS,
  APPLICATION_SOURCES,
  CURRENCIES,
  SALARY_RATES,
  type JobApplication,
} from "@/types/application";
import type { Resume } from "@/types/resume";

/* ─── Zod schema ─────────────────────────────────────────────── */
const schema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_logo_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  position: z.string().min(1, "Position is required"),
  employment_type: z.enum(EMPLOYMENT_TYPES),
  work_setup: z.enum(WORK_SETUPS),
  location: z.string().optional(),
  status: z.enum(STATUSES),
  date_applied: z.string().min(1, "Date applied is required"),
  application_source: z.string().optional(),
  resume_id: z.string().nullable(),
  salary_amount: z.string().optional(),
  salary_currency: z.enum(CURRENCIES).optional(),
  salary_rate: z.enum(SALARY_RATES).optional(),
  recruiter_name: z.string().optional(),
  recruiter_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  job_description: z.string().optional(),
  cover_letter: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type CoverLetterMode = "none" | "write";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function SidebarField({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ContentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

/* ─── Cover letter mode selector ─────────────────────────────── */
function CoverLetterModeButton({
  active,
  disabled,
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: React.ElementType;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-center text-xs transition-colors ${
        disabled
          ? "cursor-not-allowed border-border opacity-40"
          : active
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted"
      }`}
    >
      <Icon className="size-4" />
      <span className="font-semibold">{label}</span>
      <span className="text-[10px] leading-tight opacity-70">{sub}</span>
    </button>
  );
}

/* ─── Props ───────────────────────────────────────────────────── */
interface ApplicationFormProps {
  mode: "create" | "edit";
  application?: JobApplication;
  resumes: Resume[];
}

/* ─── Component ───────────────────────────────────────────────── */
export function ApplicationForm({ mode, application, resumes }: ApplicationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [coverLetterMode, setCoverLetterMode] = useState<CoverLetterMode>(
    application?.cover_letter ? "write" : "none"
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: application?.company_name ?? "",
      company_logo_url: application?.company_logo_url ?? "",
      position: application?.position ?? "",
      employment_type: application?.employment_type ?? "Full-time",
      work_setup: application?.work_setup ?? "On-site",
      location: application?.location ?? "",
      status: application?.status ?? "Applied",
      date_applied: application?.date_applied ?? today(),
      application_source: application?.application_source ?? "",
      resume_id: application?.resume_id ?? null,
      salary_amount: application?.salary_amount ?? "",
      salary_currency: application?.salary_currency as typeof CURRENCIES[number] | undefined ?? "PHP",
      salary_rate: application?.salary_rate as typeof SALARY_RATES[number] | undefined ?? "Monthly",
      recruiter_name: application?.recruiter_name ?? "",
      recruiter_email: application?.recruiter_email ?? "",
      job_description: application?.job_description ?? "",
      cover_letter: application?.cover_letter ?? "",
      notes: application?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const clean = {
      company_name: values.company_name,
      company_logo_url: values.company_logo_url || null,
      position: values.position,
      employment_type: values.employment_type,
      work_setup: values.work_setup,
      location: values.location || null,
      status: values.status,
      date_applied: values.date_applied,
      application_source: values.application_source || null,
      resume_id: values.resume_id || null,
      salary_amount: values.salary_amount || null,
      salary_currency: values.salary_amount ? (values.salary_currency ?? null) : null,
      salary_rate: values.salary_amount ? (values.salary_rate ?? null) : null,
      recruiter_name: values.recruiter_name || null,
      recruiter_email: values.recruiter_email || null,
      job_description: values.job_description || null,
      cover_letter: coverLetterMode === "none" ? null : values.cover_letter || null,
      notes: values.notes || null,
    };

    if (mode === "create") {
      const result = await createApplication(clean);
      if (result.error) { setServerError(result.error); return; }
      router.push(`/applications/${result.id}`);
    } else {
      const result = await updateApplication(application!.id, {
        ...clean,
        previousStatus: application!.status,
      });
      if (result.error) { setServerError(result.error); return; }
      router.push(`/applications/${application!.id}`);
    }
  }

  const title = mode === "create" ? "New Application" : "Edit Application";
  const subtitle =
    mode === "edit"
      ? `${application?.position} at ${application?.company_name}`
      : "Track a new job opportunity";

  return (
    <>
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="hidden sm:inline">
              {mode === "edit" ? application?.company_name : "Applications"}
            </span>
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="application-form"
              size="sm"
              className="min-w-28 border-0"
              disabled={isSubmitting}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
              }}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "create" ? (
                "Save application"
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Form body ── */}
      <form
        id="application-form"
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-6xl px-6 py-8"
      >
        {serverError && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {serverError}
          </div>
        )}

        {/* ── Hero row ── */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="company_name" className="text-xs text-muted-foreground">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              placeholder="Acme Corp"
              className="h-11 text-base"
              {...register("company_name")}
              aria-invalid={!!errors.company_name}
            />
            <FieldError message={errors.company_name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="position" className="text-xs text-muted-foreground">
              Position <span className="text-red-500">*</span>
            </Label>
            <Input
              id="position"
              placeholder="Senior Software Engineer"
              className="h-11 text-base"
              {...register("position")}
              aria-invalid={!!errors.position}
            />
            <FieldError message={errors.position?.message} />
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

          {/* ── Left: Content ── */}
          <div className="space-y-5">

            {/* Job description */}
            <ContentCard title="About the Role">
              <div className="space-y-1.5">
                <Label htmlFor="job_description" className="text-xs text-muted-foreground">
                  Job Description
                </Label>
                <Textarea
                  id="job_description"
                  rows={8}
                  placeholder="Paste the job posting here — useful for AI analysis later…"
                  className="resize-y"
                  {...register("job_description")}
                />
              </div>
            </ContentCard>

            {/* Cover letter */}
            <ContentCard title="Cover Letter">
              {/* Mode selector */}
              <div className="flex gap-2">
                <CoverLetterModeButton
                  active={coverLetterMode === "none"}
                  icon={X}
                  label="None"
                  sub="No cover letter"
                  onClick={() => setCoverLetterMode("none")}
                />
                <CoverLetterModeButton
                  active={coverLetterMode === "write"}
                  icon={PenLine}
                  label="Write"
                  sub="Type manually"
                  onClick={() => setCoverLetterMode("write")}
                />
                <CoverLetterModeButton
                  active={false}
                  disabled
                  icon={Sparkles}
                  label="AI Generate"
                  sub="Coming soon"
                  onClick={() => {}}
                />
                <CoverLetterModeButton
                  active={false}
                  disabled
                  icon={BookOpen}
                  label="Saved"
                  sub="Coming soon"
                  onClick={() => {}}
                />
              </div>

              {coverLetterMode === "write" && (
                <div className="space-y-1.5">
                  <Textarea
                    id="cover_letter"
                    rows={8}
                    placeholder="Write your cover letter here…"
                    className="resize-y"
                    {...register("cover_letter")}
                  />
                </div>
              )}

              {coverLetterMode === "none" && (
                <p className="rounded-lg bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
                  No cover letter attached to this application.
                </p>
              )}
            </ContentCard>

            {/* Notes */}
            <ContentCard title="Notes">
              <Textarea
                id="notes"
                rows={3}
                placeholder="Interview prep, things to mention, impressions…"
                className="resize-y"
                {...register("notes")}
              />
            </ContentCard>

          </div>

          {/* ── Right: Sidebar ── */}
          <div className="space-y-4">

            {/* Details */}
            <SidebarCard title="Details">
              <SidebarField label="Status">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </SidebarField>

              <SidebarField label={<>Date Applied <span className="text-red-500">*</span></>}>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  {...register("date_applied")}
                  aria-invalid={!!errors.date_applied}
                />
                <FieldError message={errors.date_applied?.message} />
              </SidebarField>

              <SidebarField label="Employment Type">
                <Controller
                  control={control}
                  name="employment_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </SidebarField>

              <SidebarField label="Work Setup">
                <Controller
                  control={control}
                  name="work_setup"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_SETUPS.map((s) => (
                          <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </SidebarField>

              <SidebarField label="Location">
                <Input
                  placeholder="Manila, PH"
                  className="h-9 text-sm"
                  {...register("location")}
                />
              </SidebarField>
            </SidebarCard>

            {/* Salary */}
            <SidebarCard title="Compensation">
              <SidebarField label="Amount">
                <Input
                  placeholder="50,000"
                  className="h-9 text-sm"
                  {...register("salary_amount")}
                />
              </SidebarField>
              <div className="grid grid-cols-2 gap-2">
                <SidebarField label="Currency">
                  <Controller
                    control={control}
                    name="salary_currency"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "PHP"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </SidebarField>
                <SidebarField label="Rate">
                  <Controller
                    control={control}
                    name="salary_rate"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "Monthly"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SALARY_RATES.map((r) => (
                            <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </SidebarField>
              </div>
            </SidebarCard>

            {/* Application */}
            <SidebarCard title="Application">
              <SidebarField label="Source">
                <Controller
                  control={control}
                  name="application_source"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Where did you find it?" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_SOURCES.map((s) => (
                          <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </SidebarField>

              <SidebarField label="Resume">
                <Controller
                  control={control}
                  name="resume_id"
                  render={({ field }) => (
                    <ResumeSelector
                      value={field.value}
                      onChange={(id) => setValue("resume_id", id)}
                      resumes={resumes}
                    />
                  )}
                />
              </SidebarField>
            </SidebarCard>

            {/* Recruiter */}
            <SidebarCard title="Recruiter">
              <SidebarField label="Name">
                <Input
                  placeholder="Jane Doe"
                  className="h-9 text-sm"
                  {...register("recruiter_name")}
                />
              </SidebarField>
              <SidebarField label="Email">
                <Input
                  type="email"
                  placeholder="jane@company.com"
                  className="h-9 text-sm"
                  {...register("recruiter_email")}
                  aria-invalid={!!errors.recruiter_email}
                />
                <FieldError message={errors.recruiter_email?.message} />
              </SidebarField>
            </SidebarCard>

            {/* Company */}
            <SidebarCard title="Company">
              <SidebarField label="Logo URL">
                <Input
                  placeholder="https://company.com/logo.png"
                  className="h-9 text-sm"
                  {...register("company_logo_url")}
                  aria-invalid={!!errors.company_logo_url}
                />
                <FieldError message={errors.company_logo_url?.message} />
              </SidebarField>
            </SidebarCard>

          </div>
        </div>
      </form>
    </>
  );
}
