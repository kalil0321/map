export function addUtmParams(
    url: string,
    source: string = 'stapply',
    medium: string = 'job_board',
    campaign: string = 'job_listing'
): string {
    try {
        const urlObj = new URL(url);
        
        if (!urlObj.searchParams.has('utm_source')) {
            urlObj.searchParams.set('utm_source', source);
        }
        if (!urlObj.searchParams.has('utm_medium')) {
            urlObj.searchParams.set('utm_medium', medium);
        }
        if (!urlObj.searchParams.has('utm_campaign')) {
            urlObj.searchParams.set('utm_campaign', campaign);
        }
        
        return urlObj.toString();
    } catch {
        return url;
    }
}

