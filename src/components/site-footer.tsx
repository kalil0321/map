import Link from 'next/link';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  const popularCompanies = [
    { name: 'OpenAI', slug: 'openai' },
    { name: 'Anthropic', slug: 'anthropic' },
    { name: 'Google', slug: 'google' },
    { name: 'Microsoft', slug: 'microsoft' },
    { name: 'Meta', slug: 'meta' },
    { name: 'Apple', slug: 'apple' },
  ];

  const popularRoles = [
    { name: 'Software Engineer', slug: 'software-engineer' },
    { name: 'Machine Learning Engineer', slug: 'machine-learning-engineer' },
    { name: 'Product Manager', slug: 'product-manager' },
    { name: 'Data Scientist', slug: 'data-scientist' },
    { name: 'Research Scientist', slug: 'research-scientist' },
  ];

  const popularLocations = [
    { name: 'San Francisco', slug: 'san-francisco' },
    { name: 'New York', slug: 'new-york' },
    { name: 'Tokyo', slug: 'tokyo' },
    { name: 'London', slug: 'london' },
    { name: 'Seattle', slug: 'seattle' },
  ];

  return (
    <footer className="border-t border-white/10 bg-black text-white/70 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Companies */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-base">Popular Companies</h3>
            <ul className="space-y-2">
              {popularCompanies.map((company) => (
                <li key={company.slug}>
                  <Link
                    href={`/jobs/${company.slug}`}
                    className="hover:text-white transition-colors no-underline"
                  >
                    {company.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/companies"
                  className="text-blue-400 hover:text-blue-300 transition-colors no-underline"
                >
                  View all companies →
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-base">Top Roles</h3>
            <ul className="space-y-2">
              {popularRoles.map((role) => (
                <li key={role.slug}>
                  <Link
                    href={`/roles/${role.slug}`}
                    className="hover:text-white transition-colors no-underline"
                  >
                    {role.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/roles"
                  className="text-blue-400 hover:text-blue-300 transition-colors no-underline"
                >
                  View all roles →
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-base">Popular Locations</h3>
            <ul className="space-y-2">
              {popularLocations.map((location) => (
                <li key={location.slug}>
                  <Link
                    href={`/locations/${location.slug}`}
                    className="hover:text-white transition-colors no-underline"
                  >
                    {location.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/locations"
                  className="text-blue-400 hover:text-blue-300 transition-colors no-underline"
                >
                  View all locations →
                </Link>
              </li>
            </ul>
          </div>

          {/* About & Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-base">Stapply</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-white transition-colors no-underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors no-underline">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/internships" className="hover:text-white transition-colors no-underline">
                  Internships
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors no-underline">
                  Browse All Jobs
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors no-underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors no-underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://x.com/stapply_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors no-underline inline-flex items-center gap-1"
                >
                  Follow us on X
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/50 m-0">
            © {currentYear} Stapply. All rights reserved.
          </p>
          <p className="text-xs text-white/50 m-0">
            Discover jobs at tech companies on an interactive map
          </p>
        </div>
      </div>
    </footer>
  );
}
