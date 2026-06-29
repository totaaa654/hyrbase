import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to see you, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your job search dashboard is ready. Start by adding an application.
        </p>
      </div>

      {/* Placeholder stats grid — will be replaced when analytics feature is built */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Applied", value: "0" },
          { label: "In Progress", value: "0" },
          { label: "Offers", value: "0" },
          { label: "Response Rate", value: "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
