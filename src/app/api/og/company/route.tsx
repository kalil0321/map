import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { loadJobsWithCoordinatesServer } from '../../../../utils/data-processor-server';
import { slugify } from '../../../../lib/slug-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companySlug = searchParams.get('company');

        if (!companySlug) {
            return new Response('Missing company parameter', { status: 400 });
        }

        // Load jobs and find matching company jobs using server-compatible loader
        const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
        const matchingJobs = allJobs.filter(job => slugify(job.company) === companySlug);

        if (matchingJobs.length === 0) {
            return new Response('Company not found', { status: 404 });
        }

        const companyName = matchingJobs[0].company;
        const jobCount = matchingJobs.length;
        const locations = new Set(matchingJobs.map(job => job.location));
        const locationCount = locations.size;

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
                    {/* Subtle grid pattern overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    {/* Accent glow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: -100,
                            right: -100,
                            width: 400,
                            height: 400,
                            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
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
                        {/* Company name */}
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
                            {companyName.toUpperCase()}
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
                            {/* Job count badge */}
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
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                                <span>{jobCount.toLocaleString()} {jobCount === 1 ? 'role' : 'roles'}</span>
                            </div>

                            {/* Location count badge */}
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
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{locationCount} {locationCount === 1 ? 'location' : 'locations'}</span>
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
        console.error('Error generating company OG image:', error);
        return new Response('Failed to generate image', { status: 500 });
    }
}
