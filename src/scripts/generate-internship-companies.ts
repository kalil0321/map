/**
 * Script to generate internship-companies.json
 * Run with: npx tsx src/scripts/generate-internship-companies.ts
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Internship detection keywords
const INTERNSHIP_KEYWORDS = [
  'intern',
  'internship',
  'graduate',
  'new grad',
  'new-grad',
  'newgrad',
  'university graduate',
  'university grad',
  'college graduate',
  'recent graduate',
  'entry level',
  'entry-level',
  'summer 2025',
  'summer 2026',
  'winter 2025',
  'winter 2026',
  'fall 2025',
  'fall 2026',
  '2025 intern',
  '2026 intern',
  '2025 graduate',
  '2026 graduate',
  'early career',
  'campus',
  'undergraduate',
  'phd intern',
  'masters intern',
  'mba intern',
];

const EXCLUDE_KEYWORDS = [
  'internal',
  'international',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isInternshipJob(title: string): boolean {
  const titleLower = title.toLowerCase();
  
  for (const exclude of EXCLUDE_KEYWORDS) {
    if (titleLower.includes(exclude) && !titleLower.includes('intern')) {
      return false;
    }
  }
  
  for (const keyword of INTERNSHIP_KEYWORDS) {
    if (titleLower.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

interface Job {
  title: string;
  company: string;
  location: string;
  url: string;
}

interface CompanyStats {
  company: string;
  companySlug: string;
  internshipCount: number;
  locations: string[];
  sampleTitles: string[];
}

async function main() {
  const csvPath = path.join(process.cwd(), 'public', 'ai.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    process.exit(1);
  }
  
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  
  const result = Papa.parse<Job>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  
  const jobs = result.data;
  console.log(`Loaded ${jobs.length} total jobs`);
  
  // Filter for internship jobs
  const internshipJobs = jobs.filter(job => isInternshipJob(job.title));
  console.log(`Found ${internshipJobs.length} internship/graduate jobs`);
  
  // Group by company
  const companyMap = new Map<string, {
    jobs: Job[];
    locations: Set<string>;
  }>();
  
  for (const job of internshipJobs) {
    if (!job.company) continue;
    
    const existing = companyMap.get(job.company);
    if (existing) {
      existing.jobs.push(job);
      if (job.location) existing.locations.add(job.location);
    } else {
      companyMap.set(job.company, {
        jobs: [job],
        locations: new Set(job.location ? [job.location] : []),
      });
    }
  }
  
  // Build stats array
  const stats: CompanyStats[] = [];
  
  for (const [company, data] of companyMap.entries()) {
    stats.push({
      company,
      companySlug: slugify(company),
      internshipCount: data.jobs.length,
      locations: Array.from(data.locations),
      sampleTitles: data.jobs.slice(0, 5).map(j => j.title),
    });
  }
  
  // Sort by count descending
  stats.sort((a, b) => b.internshipCount - a.internshipCount);
  
  // Filter for companies with 4+ internships
  const qualifyingCompanies = stats.filter(s => s.internshipCount >= 4);
  
  console.log(`\n=== Companies with 4+ Internships ===`);
  console.log(`Found ${qualifyingCompanies.length} qualifying companies:\n`);
  
  for (const company of qualifyingCompanies) {
    console.log(`- ${company.company}: ${company.internshipCount} internships across ${company.locations.length} locations`);
  }
  
  // Write to JSON file
  const outputPath = path.join(process.cwd(), 'src', 'data', 'internship-companies.json');
  
  const output = {
    generatedAt: new Date().toISOString(),
    minThreshold: 4,
    totalInternshipJobs: internshipJobs.length,
    qualifyingCompanyCount: qualifyingCompanies.length,
    companies: qualifyingCompanies,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to: ${outputPath}`);
}

main().catch(console.error);
