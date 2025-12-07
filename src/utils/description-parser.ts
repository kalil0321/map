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
 * Check if text contains HTML tags
 */
function isHTML(text: string): boolean {
  return /<[^>]+>/.test(text);
}

/**
 * Decode HTML entities in text
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Strip HTML tags from text and decode entities
 */
function stripHTMLTags(html: string): string {
  // First remove all HTML tags
  const textOnly = html.replace(/<[^>]+>/g, '');
  // Then decode HTML entities
  return decodeHTMLEntities(textOnly).trim();
}

/**
 * Parse HTML job description into structured sections
 * Preserves the order of content as it appears in the HTML
 */
function parseHTMLDescription(html: string): ParsedDescription {
  const sections: ParsedSection[] = [];

  // Remove wrapper divs and closing div tags
  let cleanHtml = html
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '');

  // Find all block-level elements with their positions
  interface BlockElement {
    type: string;
    content: string;
    position: number;
    fullMatch: string;
  }

  const elements: BlockElement[] = [];

  // Find headings (h1-h6)
  const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = headingRegex.exec(cleanHtml)) !== null) {
    elements.push({
      type: 'heading',
      content: match[2],
      position: match.index,
      fullMatch: match[0],
    });
  }

  // Find paragraphs
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((match = paragraphRegex.exec(cleanHtml)) !== null) {
    elements.push({
      type: 'paragraph',
      content: match[1],
      position: match.index,
      fullMatch: match[0],
    });
  }

  // Find lists (ul and ol)
  const listRegex = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  while ((match = listRegex.exec(cleanHtml)) !== null) {
    elements.push({
      type: 'list',
      content: match[2],
      position: match.index,
      fullMatch: match[0],
    });
  }

  // Sort elements by position to preserve document order
  elements.sort((a, b) => a.position - b.position);

  // Convert elements to sections
  for (const element of elements) {
    if (element.type === 'heading') {
      const headingText = stripHTMLTags(element.content);
      if (headingText) {
        sections.push({
          type: 'heading',
          content: headingText,
        });
      }
    } else if (element.type === 'list') {
      // Extract list items
      const items: string[] = [];
      const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(element.content)) !== null) {
        const item = stripHTMLTags(itemMatch[1]);
        if (item) {
          items.push(item);
        }
      }

      if (items.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: items,
        });
      }
    } else if (element.type === 'paragraph') {
      // Check if paragraph contains a link
      const linkMatch = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i.exec(element.content);

      if (linkMatch) {
        // Paragraph contains a link - extract all text including link text
        const linkText = stripHTMLTags(linkMatch[2]);
        const textBeforeLink = stripHTMLTags(element.content.substring(0, element.content.indexOf(linkMatch[0])));
        const textAfterLink = stripHTMLTags(element.content.substring(element.content.indexOf(linkMatch[0]) + linkMatch[0].length));

        // Combine all text parts for the paragraph
        const fullText = [textBeforeLink, linkText, textAfterLink].filter(Boolean).join(' ');

        if (fullText) {
          sections.push({
            type: 'paragraph',
            content: fullText,
          });
        }
      } else {
        // Regular paragraph without links
        const paragraphText = stripHTMLTags(element.content);
        if (paragraphText) {
          sections.push({
            type: 'paragraph',
            content: paragraphText,
          });
        }
      }
    }
  }

  return { sections };
}

/**
 * Parse plain text job description into structured sections
 */
function parsePlainTextDescription(text: string): ParsedDescription {
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
 * Parse a job description text into structured sections
 * Handles both HTML and plain text input
 * @param text Raw job description text (HTML or plain text, may be entity-encoded)
 * @returns Parsed description with sections
 */
export function parseJobDescription(text: string): ParsedDescription {
  if (!text || !text.trim()) {
    return { sections: [] };
  }

  // First decode HTML entities in case the HTML is double-encoded
  // This handles cases where < is stored as &lt; in the database
  let decodedText = text;

  // Check if text contains encoded HTML entities
  if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&quot;')) {
    decodedText = decodeHTMLEntities(text);
  }

  // Now detect if input is HTML and parse accordingly
  if (isHTML(decodedText)) {
    return parseHTMLDescription(decodedText);
  } else {
    return parsePlainTextDescription(decodedText);
  }
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
