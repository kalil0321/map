import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Stapply\'s privacy policy explains how we collect, use, and protect your information.',
  alternates: {
    canonical: 'https://map.stapply.ai/privacy',
  },
};

export default function PrivacyPage() {
  const lastUpdated = 'January 25, 2026';

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-4 md:pb-6 space-y-6 pt-1">
        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Privacy Policy</h1>
          <p className="text-white/60 text-sm">Last updated: {lastUpdated}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Introduction</h2>
          <p className="text-white/60 leading-relaxed">
            Stapply ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service at map.stapply.ai.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Information We Collect</h2>

          <div className="space-y-4 mt-3">
            <div>
              <h3 className="text-lg font-medium mb-2 text-white/90">Usage Data</h3>
              <p className="text-white/60 leading-relaxed">
                We automatically collect certain information when you visit our website, including your IP address, browser type, referring pages, pages viewed, and time spent on pages. This helps us understand how users interact with our service and improve the experience.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-white/90">Saved Jobs and Alerts</h3>
              <p className="text-white/60 leading-relaxed">
                When you save jobs or set up alerts, we store this information locally in your browser using localStorage. This data remains on your device and is not transmitted to our servers unless you explicitly sync it through our cloud service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-white/90">Analytics</h3>
              <p className="text-white/60 leading-relaxed">
                We use Vercel Analytics to collect anonymous usage statistics. This helps us understand which features are most valuable and where we should focus our development efforts.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">How We Use Your Information</h2>
          <ul className="space-y-2 text-white/60 list-disc pl-6 mt-3">
            <li>To provide and maintain our service</li>
            <li>To improve user experience and develop new features</li>
            <li>To analyze usage patterns and optimize performance</li>
            <li>To communicate with you about updates or changes to our service</li>
            <li>To detect and prevent technical issues or abuse</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Information Sharing</h2>
          <p className="text-white/60 leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We may share aggregated, anonymized data with partners to improve our service.
          </p>
          <p className="text-white/60 leading-relaxed">
            When you click "Apply" on a job posting, you will be redirected to the employer's application system. We are not responsible for the privacy practices of third-party employers or their applicant tracking systems.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Data Security</h2>
          <p className="text-white/60 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Your Rights</h2>
          <p className="text-white/60 leading-relaxed">
            You have the right to:
          </p>
          <ul className="space-y-2 text-white/60 list-disc pl-6 mt-3">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to processing of your information</li>
            <li>Clear your saved jobs and alerts from your browser at any time</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Cookies and Tracking</h2>
          <p className="text-white/60 leading-relaxed">
            We use localStorage to remember your preferences and saved jobs. We use analytics cookies to understand how users interact with our service. You can disable cookies in your browser settings, though this may affect functionality.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Children's Privacy</h2>
          <p className="text-white/60 leading-relaxed">
            Our service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Changes to This Policy</h2>
          <p className="text-white/60 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Contact Us</h2>
          <p className="text-white/60 leading-relaxed">
            If you have questions about this Privacy Policy, please contact us via{' '}
            <a
              href="https://x.com/stapply_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors no-underline"
            >
              X (Twitter)
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
