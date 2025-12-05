import { redirect } from 'next/navigation';

export default async function CompanyPage({ params }: { params: Promise<{ name: string }> }) {
  // Redirect /company/[name] to /companies
  redirect('/companies');
}
