import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { loadJobsWithCoordinatesServer } from '../../../../utils/data-processor-server';

export const runtime = 'nodejs';

// Predefined positions for floating company names to avoid randomness issues in OG
const COMPANY_POSITIONS = [
    { top: 80, left: 200, size: 18, opacity: 0.12 },
    { top: 120, left: 500, size: 24, opacity: 0.15 },
    { top: 60, left: 750, size: 16, opacity: 0.1 },
    { top: 160, left: 900, size: 20, opacity: 0.12 },
    { top: 200, left: 150, size: 22, opacity: 0.14 },
    { top: 180, left: 400, size: 16, opacity: 0.08 },
    { top: 240, left: 650, size: 26, opacity: 0.16 },
    { top: 220, left: 1000, size: 18, opacity: 0.1 },
    { top: 280, left: 80, size: 20, opacity: 0.12 },
    { top: 300, left: 350, size: 14, opacity: 0.08 },
    { top: 260, left: 550, size: 22, opacity: 0.14 },
    { top: 320, left: 800, size: 18, opacity: 0.1 },
    { top: 340, left: 1050, size: 16, opacity: 0.08 },
    { top: 100, left: 1100, size: 14, opacity: 0.06 },
    { top: 380, left: 250, size: 20, opacity: 0.1 },
    { top: 360, left: 600, size: 24, opacity: 0.12 },
    { top: 140, left: 300, size: 14, opacity: 0.06 },
    { top: 400, left: 450, size: 16, opacity: 0.08 },
];

export async function GET(request: NextRequest) {
    try {
        // Load all jobs
        const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');

        // Get unique companies
        const companiesSet = new Set(allJobs.map(job => job.company));
        const companyCount = companiesSet.size;
        const companyNames = Array.from(companiesSet);
        const jobCount = allJobs.length;

        // Shuffle and select companies for background display
        const shuffled = [...companyNames].sort(() => Math.random() - 0.5);
        const displayCompanies = shuffled.slice(0, COMPANY_POSITIONS.length);

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                    }}
                >
                    {/* Floating company names in background */}
                    {displayCompanies.map((company, i) => {
                        const pos = COMPANY_POSITIONS[i];
                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    top: pos.top,
                                    left: pos.left,
                                    fontSize: pos.size,
                                    fontWeight: 600,
                                    color: `rgba(255, 255, 255, ${pos.opacity})`,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                }}
                            >
                                {company}
                            </div>
                        );
                    })}

                    {/* Gradient overlay to fade company names at bottom */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 300,
                            background: 'linear-gradient(to top, #0f172a 0%, transparent 100%)',
                            display: 'flex',
                        }}
                    />

                    {/* Stapply Logo in the top left */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 48,
                            left: 48,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 20,
                        }}
                    >
                        <svg
                            width="38"
                            height="38"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <rect x="3" y="6" width="14" height="16" rx="2" fill="#3b82f6" opacity="0.3" />
                            <rect x="4" y="4" width="14" height="16" rx="2" fill="#3b82f6" opacity="0.8" />
                            <rect x="5" y="2" width="14" height="16" rx="2" fill="#2563eb" opacity="0.9" />
                            <rect x="7" y="4" width="10" height="3" rx="1" fill="white" />
                            <line x1="7" y1="9" x2="17" y2="9" strokeWidth="0.5" stroke="white" opacity="0.6" />
                            <line x1="7" y1="11" x2="15" y2="11" strokeWidth="0.5" stroke="white" opacity="0.6" />
                            <line x1="7" y1="13" x2="16" y2="13" strokeWidth="0.5" stroke="white" opacity="0.6" />
                        </svg>
                    </div>

                    {/* Content */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '60px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}
                    >
                        {/* Page title */}
                        <div
                            style={{
                                fontSize: '64px',
                                fontWeight: 'bold',
                                color: 'white',
                                lineHeight: 1.2,
                                maxWidth: '90%',
                                display: 'flex',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            COMPANIES DIRECTORY
                        </div>

                        {/* Stats badges */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                flexWrap: 'wrap',
                            }}
                        >
                            {/* Company count badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    borderRadius: '9999px',
                                    padding: '10px 24px',
                                    fontSize: '24px',
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    fontWeight: '600',
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>{companyCount.toLocaleString()} {companyCount === 1 ? 'company' : 'companies'}</span>
                            </div>

                            {/* Job count badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '9999px',
                                    padding: '10px 24px',
                                    fontSize: '24px',
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    fontWeight: '600',
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                                <span>{jobCount.toLocaleString()} {jobCount === 1 ? 'role' : 'roles'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error('Error generating companies OG image:', error);
        return new Response('Failed to generate image', { status: 500 });
    }
}
