import { fuzzyMatch } from './fuzzy-match';

type BooleanQuery = { type: 'OR' | 'AND'; terms: string[] };

const INTERNSHIP_TERMS = new Set(['intern', 'interns', 'internship', 'internships']);

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForSearch(value).match(/[a-z0-9]+/g) ?? [];
}

function isPluralVariant(token: string, term: string): boolean {
  return token === `${term}s` || term === `${token}s`;
}

function tokenMatchesTerm(token: string, term: string): boolean {
  if (INTERNSHIP_TERMS.has(term)) {
    return INTERNSHIP_TERMS.has(token);
  }

  if (token === term || isPluralVariant(token, term)) {
    return true;
  }

  if (term.length >= 5 && token.startsWith(term)) {
    const suffix = token.slice(term.length);
    return ['ing', 'er', 'ers', 'ed'].includes(suffix);
  }

  return false;
}

/**
 * Parse boolean query with OR/AND operators and comma separators.
 */
export function parseBooleanQuery(query: string): BooleanQuery {
  const normalized = query.toLowerCase().trim();

  if (/\s+or\s+/i.test(normalized)) {
    const terms = normalized.split(/\s+or\s+/i).map(t => t.trim()).filter(t => t.length > 0);
    return { type: 'OR', terms };
  }

  if (/\s+and\s+/i.test(normalized)) {
    const terms = normalized.split(/\s+and\s+/i).map(t => t.trim()).filter(t => t.length > 0);
    return { type: 'AND', terms };
  }

  if (/,/.test(normalized)) {
    const terms = normalized.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (terms.length > 1) {
      return { type: 'OR', terms };
    }
  }

  const terms = normalized.split(/\s+/).filter(t => t.length > 0);
  return { type: 'AND', terms };
}

/**
 * Token-aware text match. This prevents short job terms like "intern" from
 * matching unrelated words like "internal" or "international".
 */
export function matchesSearchTerm(text: string, term: string, options: { fuzzy?: boolean } = {}): boolean {
  const normalizedTerm = normalizeForSearch(term);
  if (!normalizedTerm) return true;

  const textTokens = tokenize(text);
  const termTokens = tokenize(normalizedTerm);
  if (termTokens.length === 0) return true;

  if (termTokens.length > 1) {
    return termTokens.every(token => matchesSearchTerm(text, token, options));
  }

  const singleTerm = termTokens[0];
  if (textTokens.some(token => tokenMatchesTerm(token, singleTerm))) {
    return true;
  }

  if (options.fuzzy && singleTerm.length >= 5 && !INTERNSHIP_TERMS.has(singleTerm)) {
    return textTokens.some(token => token.length >= 5 && fuzzyMatch(token, singleTerm, 0.82));
  }

  return false;
}

/**
 * General multi-field search. Space-separated terms use AND logic across all
 * fields, so "software intern" means both words must appear somewhere.
 */
export function matchesKeywordSearch(fields: string[], query: string): boolean {
  const { type, terms } = parseBooleanQuery(query);
  if (terms.length === 0) return true;

  const termMatches = (term: string) => fields.some(field => matchesSearchTerm(field, term));

  return type === 'OR'
    ? terms.some(termMatches)
    : terms.every(termMatches);
}
