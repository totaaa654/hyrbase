import Link from "next/link";
import { Plus, Briefcase, TrendingUp, Trophy, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getApplications } from "../applications/actions";
import type { JobApplication } from "@/types/application";

function calcStats(apps: JobApplication[]) {
  const total = apps.length;
  const inProgress = apps.filter((a) =>
    [
      "Applied",
      "Assessment",
      "HR Interview",
      "Technical Interview",
      "Final Interview",
    ].includes(a.status)
  ).length;
  const offers = apps.filter((a) =>
    ["Offer", "Accepted"].includes(a.status)
  ).length;
  const responded = apps.filter((a) => a.status !== "Wishlist").length;
  const responseRate =
    responded > 0
      ? Math.round(
          (apps.filter((a) =>
            [
              "Assessment",
              "HR Interview",
              "Technical Interview",
              "Final Interview",
              "Offer",
              "Accepted",
            ].includes(a.status)
          ).length /
            Math.max(responded, 1)) *
            100
        )
      : null;

  return { total, inProgress, offers, responseRate };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "there";
  const firstName = name.split(" ")[0];

  const applications = await getApplications();
  const { total, inProgress, offers, responseRate } = calcStats(applications);

  const recentApps = applications.slice(0, 5);

  const statCards = [
    { label: "Total Applied", value: total.toString(), icon: Briefcase, color: "text-blue-400" },
    { label: "In Progress", value: inProgress.toString(), icon: TrendingUp, color: "text-violet-400" },
    { label: "Offers", value: offers.toString(), icon: Trophy, color: "text-emerald-400" },
    {
      label: "Response Rate",
      value: responseRate !== null ? `${responseRate}%` : "—",
      icon: BarChart2,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good to see you, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s a snapshot of your job search.
          </p>
        </div>
        <Button
          asChild
          className="gap-2 border-0 shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
          }}
        >
          <Link href="/applications/new">
            <Plus className="size-4" />
            Add application
          </Link>
        </Button>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <Icon className={`size-4 ${color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Recent applications ── */}
      {recentApps.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Applications</h2>
            <Link
              href="/applications"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {app.position}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {app.company_name}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium`}
                  style={{ borderColor: "transparent" }}
                >
                  {app.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <Briefcase className="size-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-sm font-semibold">No applications yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start tracking your job search by adding your first application.
          </p>
          <Button
            asChild
            className="mt-4 gap-2 border-0"
            size="sm"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
            }}
          >
            <Link href="/applications/new">
              <Plus className="size-4" />
              Add application
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
