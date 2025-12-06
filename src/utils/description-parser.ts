/**
 * Parse and format job description text into structured HTML
 * Handles sections, bullet points, links, and paragraphs
 */

export interface ParsedSection {
  type: 'heading' | 'paragraph' | 'list' | 'link';
  content: string;
  items?: string[]; // For list type
  url?: string; // For link type
}

export interface ParsedDescription {
  sections: ParsedSection[];
}

/**
 * Parse a job description text into structured sections
 * @param text Raw job description text
 * @returns Parsed description with sections
 */
export function parseJobDescription(text: string): ParsedDescription {
  if (!text || !text.trim()) {
    return { sections: [] };
  }

  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let currentList: string[] = [];
  let currentParagraph = '';

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      sections.push({
        type: 'paragraph',
        content: currentParagraph.trim(),
      });
      currentParagraph = '';
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({
        type: 'list',
        content: '',
        items: [...currentList],
      });
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      flushParagraph();
      continue;
    }

    // Check if line is a heading (capitalized words, no punctuation at end except colon)
    const isHeading =
      /^[A-Z][A-Za-z\s&,'-]+(?:[:']s)?$/.test(trimmedLine) &&
      !trimmedLine.endsWith('.') &&
      trimmedLine.length < 100;

    // Check if line is a bullet point (starts with -, *, •, or numbered)
    const isBullet = /^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);

    // Check if line contains a URL
    const urlMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/);

    if (isHeading) {
      flushParagraph();
      flushList();
      sections.push({
        type: 'heading',
        content: trimmedLine.replace(/:$/, ''), // Remove trailing colon
      });
    } else if (isBullet) {
      flushParagraph();
      // Extract bullet content (remove bullet marker)
      const bulletContent = trimmedLine
        .replace(/^\s*[-*•]\s+/, '')
        .replace(/^\s*\d+\.\s+/, '')
        .trim();
      currentList.push(bulletContent);
    } else if (urlMatch) {
      flushParagraph();
      flushList();

      // Extract text before URL and the URL itself
      const url = urlMatch[1];
      const textBeforeUrl = trimmedLine.substring(0, urlMatch.index).trim();

      sections.push({
        type: 'link',
        content: textBeforeUrl || 'Link',
        url: url,
      });
    } else {
      flushList();
      // Regular paragraph text - accumulate with space
      if (currentParagraph) {
        currentParagraph += ' ' + trimmedLine;
      } else {
        currentParagraph = trimmedLine;
      }
    }
  }

  // Flush any remaining content
  flushParagraph();
  flushList();

  return { sections };
}

/**
 * Convert parsed description to HTML string
 * @param parsed Parsed description
 * @returns HTML string
 */
export function descriptionToHTML(parsed: ParsedDescription): string {
  return parsed.sections
    .map((section) => {
      switch (section.type) {
        case 'heading':
          return `<h3>${escapeHTML(section.content)}</h3>`;
        case 'paragraph':
          return `<p>${escapeHTML(section.content)}</p>`;
        case 'list':
          const items = section.items
            ?.map((item) => `<li>${escapeHTML(item)}</li>`)
            .join('');
          return `<ul>${items}</ul>`;
        case 'link':
          return `<p>${escapeHTML(section.content)} <a href="${escapeHTML(section.url || '')}" target="_blank" rel="noopener noreferrer">${escapeHTML(section.url || '')}</a></p>`;
        default:
          return '';
      }
    })
    .join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for server-side
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format job description for React rendering
 * Returns array of React-compatible section objects
 */
export function formatDescriptionForReact(text: string) {
  const parsed = parseJobDescription(text);
  return parsed.sections;
}
