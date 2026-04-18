// Dry-run the sitemap to see how many URLs it produces, broken down by
// section. Run: npx tsx scripts/sitemap-stats.ts
import sitemap, { generateSitemaps } from '../src/app/sitemap';

async function main() {
  const sitemaps = await generateSitemaps();
  const all: Array<{ url: string; lastModified?: string | Date }> = [];
  for (const { id } of sitemaps) {
    const entries = await sitemap({ id: Promise.resolve(String(id)) });
    all.push(...entries);
  }
  const byKind: Record<string, number> = {};
  for (const e of all) {
    const m = e.url.match(/stapply\.ai(\/[^/]+)?/);
    const k = m ? m[1] || '/' : '?';
    byKind[k] = (byKind[k] || 0) + 1;
  }
  console.log('sitemap files:', sitemaps.length);
  console.log('total URLs:   ', all.length);
  console.log('by section:');
  for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(18)} ${v}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
