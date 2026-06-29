import { ApplicationForm } from "@/components/applications/application-form";
import { getResumes } from "@/app/(dashboard)/resumes/actions";

export const metadata = {
  title: "New Application – HyrBase",
};

export default async function NewApplicationPage() {
  const resumes = await getResumes();
  return <ApplicationForm mode="create" resumes={resumes} />;
}
