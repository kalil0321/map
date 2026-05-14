import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  const lastUpdated = 'January 25, 2026';

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-4 md:pb-6 space-y-6 pt-1">
        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Terms of Service</h1>
          <p className="text-white/60 text-sm">Last updated: {lastUpdated}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Agreement to Terms</h2>
          <p className="text-white/60 leading-relaxed">
            By accessing and using Stapply ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Description of Service</h2>
          <p className="text-white/60 leading-relaxed">
            Stapply is an interactive job map and aggregation platform that helps users discover employment opportunities at technology companies worldwide. We collect publicly available job postings from various sources and present them in an accessible, visual format.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Use of Service</h2>
          <p className="text-white/60 leading-relaxed">
            You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
          </p>
          <ul className="space-y-2 text-white/60 list-disc pl-6 mt-3">
            <li>Use the Service in any way that violates applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use automated systems to scrape or download content from the Service</li>
            <li>Impersonate or attempt to impersonate Stapply or any other user</li>
            <li>Use the Service to transmit spam, malware, or other harmful code</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Job Listings</h2>
          <p className="text-white/60 leading-relaxed">
            Job listings on Stapply are aggregated from third-party sources. We do not guarantee the accuracy, completeness, or availability of any job posting. We are not responsible for:
          </p>
          <ul className="space-y-2 text-white/60 list-disc pl-6 mt-3">
            <li>The content or accuracy of job descriptions</li>
            <li>The hiring practices of employers</li>
            <li>The application process or outcomes</li>
            <li>Any employment relationship between you and an employer</li>
          </ul>
          <p className="text-white/60 leading-relaxed mt-3">
            When you apply for a job through an external link, you leave Stapply and are subject to the terms and privacy policies of the employer's application system.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Intellectual Property</h2>
          <p className="text-white/60 leading-relaxed">
            The Service and its original content (excluding job listings from third parties), features, and functionality are owned by Stapply and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
          <p className="text-white/60 leading-relaxed">
            Job listings remain the property of their respective employers. Company names, logos, and trademarks are the property of their respective owners.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">User Content</h2>
          <p className="text-white/60 leading-relaxed">
            Any content you save, such as job alerts or saved jobs, is stored locally in your browser or in our cloud service if you choose to sync. You retain all rights to this information and can delete it at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Disclaimer of Warranties</h2>
          <p className="text-white/60 leading-relaxed">
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, either express or implied. We do not warrant that:
          </p>
          <ul className="space-y-2 text-white/60 list-disc pl-6 mt-3">
            <li>The Service will be uninterrupted, timely, secure, or error-free</li>
            <li>The results obtained from using the Service will be accurate or reliable</li>
            <li>The quality of any products, services, or information obtained through the Service will meet your expectations</li>
            <li>Any errors in the Service will be corrected</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Limitation of Liability</h2>
          <p className="text-white/60 leading-relaxed">
            In no event shall Stapply, its directors, employees, partners, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from your use of or inability to use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Links to Third-Party Sites</h2>
          <p className="text-white/60 leading-relaxed">
            The Service contains links to third-party websites and services. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Changes to Terms</h2>
          <p className="text-white/60 leading-relaxed">
            We reserve the right to modify or replace these Terms at any time. We will provide notice of any material changes by updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Termination</h2>
          <p className="text-white/60 leading-relaxed">
            We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including breach of these Terms. All provisions which by their nature should survive termination shall survive.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Governing Law</h2>
          <p className="text-white/60 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Contact Us</h2>
          <p className="text-white/60 leading-relaxed">
            If you have any questions about these Terms, please contact us via{' '}
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
