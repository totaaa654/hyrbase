import { Suspense } from "react";
import { getResumes } from "./actions";
import { getResumeATSScores } from "./ats-actions";
import { ResumesClient } from "@/components/resumes/resumes-client";
import { ResumesGridSkeleton } from "@/components/resumes/skeleton";

export const metadata = {
  title: "Resumes – HyrBase",
};

async function ResumesList() {
  const resumes = await getResumes();
  // Load ATS scores from DB — never calls Gemini
  const atsScores = await getResumeATSScores(resumes.map((r) => r.id));
  return <ResumesClient resumes={resumes} atsScores={atsScores} />;
}

export default function ResumesPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <Suspense fallback={<ResumesGridSkeleton />}>
        <ResumesList />
      </Suspense>
    </div>
  );
}
