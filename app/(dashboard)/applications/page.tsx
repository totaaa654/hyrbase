import { Suspense } from "react";
import { getApplications } from "./actions";
import { ApplicationsClient } from "@/components/applications/applications-client";
import { ApplicationsGridSkeleton } from "@/components/applications/skeleton";

async function ApplicationsList() {
  const applications = await getApplications();
  return <ApplicationsClient applications={applications} />;
}

export default function ApplicationsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <Suspense fallback={<ApplicationsGridSkeleton />}>
        <ApplicationsList />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: "Applications – HyrBase",
};
