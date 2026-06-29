import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  Mail,
  User,
  DollarSign,
  ExternalLink,
  AlertCircle,
  MessageSquare,
  StickyNote,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/applications/status-badge";
import { StatusTimeline } from "@/components/applications/status-timeline";
import { DeleteButton } from "@/components/applications/delete-button";
import { ResumeViewButtons } from "@/components/applications/resume-view-buttons";
import { ResumeAnalysisPanel } from "@/components/applications/resume-analysis-panel";
import { CoverLetterViewCard } from "@/components/applications/cover-letter-view-card";
import { ExpandableCard } from "@/components/applications/expandable-card";
import { AnalysisSidebarCards } from "@/components/applications/analysis-sidebar-cards";
import { getApplication } from "../actions";
import { getResumeAnalysis } from "./analysis/actions";
import { formatSalary } from "@/types/application";

interface Props {
  params: Promise<{ id: string }>;
}

function daysSince(dateStr: string) {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  if (!value && !children) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value && <p className="text-xs font-medium text-foreground">{value}</p>}
        {children}
      </div>
    </div>
  );
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  const [application, existingAnalysis] = await Promise.all([
    getApplication(id),
    getResumeAnalysis(id),
  ]);
  if (!application) notFound();

  const daysSinceApplied = daysSince(application.date_applied);
  const daysSinceUpdated = daysSince(application.updated_at);
  const showFollowUp =
    daysSinceUpdated > 14 &&
    !["Accepted", "Rejected", "Ghosted", "Withdrawn", "Offer"].includes(
      application.status
    );

  const salary = formatSalary(
    application.salary_amount,
    application.salary_currency,
    application.salary_rate
  );

  return (
    <div className="max-w-5xl p-6">

      {/* ── Back nav + actions ── */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2 text-muted-foreground">
          <Link href="/applications">
            <ArrowLeft className="size-4" />
            Applications
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <DeleteButton applicationId={application.id} companyName={application.company_name} />
          <Button
            size="sm"
            asChild
            className="gap-2 border-0"
            style={{ background: "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))" }}
          >
            <Link href={`/applications/${application.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      {/* ── Header card ── */}
      <div className="mb-5 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {application.company_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={application.company_logo_url}
              alt={application.company_name}
              className="size-14 shrink-0 rounded-2xl border border-border object-contain p-1"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-xl font-bold text-foreground">
              {application.company_name[0]?.toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground">{application.position}</h1>
                <p className="text-sm text-muted-foreground">{application.company_name}</p>
              </div>
              <StatusBadge status={application.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5">
                {application.employment_type}
              </span>
              <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5">
                {application.work_setup}
              </span>
              {application.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {application.location}
                </span>
              )}
            </div>

            <Separator className="my-1" />

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Applied {formatDate(application.date_applied)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {daysSinceApplied === 0
                  ? "Applied today"
                  : `${daysSinceApplied}d since application`}
              </span>
              <span className="text-muted-foreground/60">
                Updated {formatDateTime(application.updated_at)}
              </span>
            </div>

            {showFollowUp && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                <AlertCircle className="size-3.5 shrink-0" />
                No updates in {daysSinceUpdated} days — consider following up.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left column: main content ── */}
        <div className="space-y-4 lg:col-span-2">

          {/* Recruiter */}
          {(application.recruiter_name || application.recruiter_email) && (
            <SectionCard title="Recruiter">
              <div className="flex flex-wrap gap-5">
                {application.recruiter_name && (
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <User className="size-3.5" />
                      Name
                    </p>
                    <p className="text-sm text-foreground">{application.recruiter_name}</p>
                  </div>
                )}
                {application.recruiter_email && (
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Mail className="size-3.5" />
                      Email
                    </p>
                    <a
                      href={`mailto:${application.recruiter_email}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {application.recruiter_email}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Job Description */}
          {application.job_description && (
            <ExpandableCard
              title="Job Description"
              expandLabel="View Full Job Description"
              preview={
                <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {application.job_description}
                </p>
              }
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {application.job_description}
              </p>
            </ExpandableCard>
          )}

          {/* Cover Letter — PDF */}
          {application.cover_letter_file_url && (
            <ExpandableCard
              title="Cover Letter"
              expandLabel="Preview & Download"
              preview={
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {application.cover_letter_file_name ?? "Cover Letter"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF · Expand to preview or download</p>
                  </div>
                </div>
              }
            >
              <CoverLetterViewCard
                fileName={application.cover_letter_file_name ?? "Cover Letter"}
                fileSize={application.cover_letter_file_size}
                uploadedAt={application.cover_letter_uploaded_at}
                storagePath={application.cover_letter_file_url}
              />
            </ExpandableCard>
          )}

          {/* Cover Letter — legacy text */}
          {!application.cover_letter_file_url && application.cover_letter && (
            <ExpandableCard
              title="Cover Letter"
              expandLabel="View Full Cover Letter"
              preview={
                <div className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {application.cover_letter}
                  </p>
                </div>
              }
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {application.cover_letter}
                </p>
              </div>
            </ExpandableCard>
          )}

          {/* Notes */}
          {application.notes && (
            <ExpandableCard
              title="Notes"
              expandLabel="View All Notes"
              preview={
                <div className="flex items-start gap-2">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {application.notes}
                  </p>
                </div>
              }
            >
              <div className="flex items-start gap-2">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {application.notes}
                </p>
              </div>
            </ExpandableCard>
          )}

          {/* AI Resume Analysis Panel */}
          <ResumeAnalysisPanel
            applicationId={application.id}
            hasResume={!!application.resume}
            hasJobDescription={!!application.job_description?.trim()}
            initialAnalysis={existingAnalysis}
          />

        </div>

        {/* ── Right column: sidebar ── */}
        <div className="space-y-4">

          {/* Status History */}
          <SectionCard title="Status History">
            <StatusTimeline history={application.status_history} />
          </SectionCard>

          {/* AI Summary + Quick Scores */}
          <AnalysisSidebarCards analysis={existingAnalysis} />

          {/* Quick Stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Stats
            </h3>
            <div className="space-y-3">
              {application.resume && (
                <StatRow icon={FileText} label="Resume Used">
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs font-medium text-foreground truncate">
                      {application.resume.display_name}
                    </p>
                    <ResumeViewButtons
                      storagePath={application.resume.file_url}
                      displayName={application.resume.display_name}
                    />
                  </div>
                </StatRow>
              )}

              <StatRow
                icon={Calendar}
                label="Date Applied"
                value={formatDate(application.date_applied)}
              />

              <StatRow
                icon={Clock}
                label="Last Updated"
                value={formatDate(application.updated_at)}
              />

              <StatRow
                icon={Briefcase}
                label="Type"
                value={`${application.employment_type} · ${application.work_setup}`}
              />

              {salary && (
                <StatRow icon={DollarSign} label="Salary" value={salary} />
              )}

              {application.application_source && (
                <StatRow
                  icon={ExternalLink}
                  label="Source"
                  value={application.application_source}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
