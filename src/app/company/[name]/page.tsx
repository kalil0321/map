import { redirect } from 'next/navigation';

export default async function CompanyPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // Redirect /company/[name] to /jobs/[name]
  redirect(`/jobs/${name}`);
}
