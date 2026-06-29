import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/applications/application-form";
import { getApplication } from "../../actions";
import { getResumes } from "@/app/(dashboard)/resumes/actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditApplicationPage({ params }: Props) {
  const { id } = await params;
  const [application, resumes] = await Promise.all([
    getApplication(id),
    getResumes(),
  ]);
  if (!application) notFound();
  return <ApplicationForm mode="edit" application={application} resumes={resumes} />;
}
