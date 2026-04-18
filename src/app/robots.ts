import { MetadataRoute } from 'next';

// Explicit allow-list for AI crawlers. Answer engines (ChatGPT, Perplexity,
// Claude, Gemini, Google AI Overviews) are a growing traffic source — the
// markdown mirror at /md and /llms.txt is built for them.
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'cohere-ai',
  'Bytespider',
  'Meta-ExternalAgent',
  'DuckAssistBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', crawlDelay: 1 },
      ...AI_CRAWLERS.map((ua) => ({ userAgent: ua, allow: '/' })),
    ],
    sitemap: 'https://map.stapply.ai/sitemap.xml',
    host: 'https://map.stapply.ai',
  };
}
