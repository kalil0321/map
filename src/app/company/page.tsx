import { redirect } from 'next/navigation';

export default function CompanyPage() {
  // Redirect /company to /companies
  redirect('/companies');
}
