import { NextResponse, type NextRequest } from 'next/server';

const BOT_USER_AGENT_PATTERNS = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /slurp/i,
  /headless/i,
  /puppeteer/i,
  /playwright/i,
  /phantomjs/i,
  /selenium/i,
  /python-requests/i,
  /aiohttp/i,
  /httpx/i,
  /gptbot/i,
  /chatgpt-user/i,
  /oai-searchbot/i,
  /claudebot/i,
  /claude-web/i,
  /anthropic-ai/i,
  /perplexity/i,
  /google-extended/i,
  /applebot/i,
  /ccbot/i,
  /cohere-ai/i,
  /bytespider/i,
  /meta-externalagent/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /pinterest/i,
  /ahrefs/i,
  /semrush/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /yandex/i,
  /baiduspider/i,
  /duckduckbot/i,
  /amazonbot/i,
  /dataforseo/i,
  /serpstat/i,
];

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent?.trim()) return true;
  return BOT_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/robots.txt') {
    return NextResponse.next();
  }

  if (isBotUserAgent(request.headers.get('user-agent'))) {
    return new NextResponse('Blocked', {
      status: 403,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg|favicon.png|icons/).*)'],
};
