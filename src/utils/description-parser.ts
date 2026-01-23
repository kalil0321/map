/**
 * Parse and format job description text into structured HTML
 * Handles sections, bullet points, links, and paragraphs
 */

export interface ParsedSection {
  type: 'heading' | 'paragraph' | 'list' | 'link' | 'salary';
  content: string;
  items?: string[]; // For list type
  url?: string; // For link type
  salaryMin?: string; // For salary type
  salaryMax?: string; // For salary type
  salaryCurrency?: string; // For salary type
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
 * Extract salary information from HTML
 * Looks for common salary patterns in job descriptions
 * Returns the salary section and its position in the HTML
 */
function extractSalaryFromHTML(html: string): { section: ParsedSection; position: number } | null {
  // Find all pay-range divs and check each one for salary amounts
  const payRangeRegex = /<div[^>]*class=["'][^"']*pay-range[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let payRangeMatch;

  while ((payRangeMatch = payRangeRegex.exec(html)) !== null) {
    const payRangeContent = payRangeMatch[1];
    const payRangePosition = payRangeMatch.index;

    // Extract salary amounts from spans within pay-range
    const spanRegex = /<span[^>]*>([^<]+)<\/span>/gi;
    const spans: string[] = [];
    let spanMatch;

    while ((spanMatch = spanRegex.exec(payRangeContent)) !== null) {
      const text = stripHTMLTags(spanMatch[1]).trim();
      // Skip divider spans (—, -, etc.) but keep salary amounts
      if (text && text !== '—' && text !== '-' && text !== '–') {
        spans.push(text);
      }
    }

    // Look for salary amounts with various formats:
    // - US format: $385,000 or $385000
    // - EU format: €155.000 or €155000
    // Support $, £, €, ¥ currencies with commas or periods as thousand separators
    const salaryAmounts = spans.filter(s => /[€$£¥]\s*[\d,\.]+/.test(s));

    if (salaryAmounts.length >= 2) {
      // Extract min and max
      const min = salaryAmounts[0];
      const max = salaryAmounts[1];

      // Extract currency from the salary string
      const currencyMatch = min.match(/^([€$£¥])/);
      const currency = currencyMatch ? currencyMatch[1] : '';

      // Clean up the amounts (remove currency symbols and extra text, normalize separators)
      // Handle both comma and period as thousand separators
      const cleanMin = min.replace(/[^\d,\.]/g, '').replace(/[,\.]/g, '');
      const cleanMax = max.replace(/[^\d,\.]/g, '').replace(/[,\.]/g, '');

      // Try to extract description text from nearby content
      let description = 'Annual Salary';
      const titleRegex = /<div[^>]*class=["'][^"']*title[^"']*["'][^>]*>([^<]+)<\/div>/i;
      const titleMatch = titleRegex.exec(html);
      if (titleMatch) {
        const titleText = stripHTMLTags(titleMatch[1]).trim();
        if (titleText) {
          description = titleText;
        }
      }

      return {
        section: {
          type: 'salary',
          content: description,
          salaryMin: cleanMin,
          salaryMax: cleanMax,
          salaryCurrency: currency,
        },
        position: payRangePosition,
      };
    } else if (salaryAmounts.length === 1) {
      // Single salary amount
      const amount = salaryAmounts[0];
      const currencyMatch = amount.match(/^([€$£¥])/);
      const currency = currencyMatch ? currencyMatch[1] : '';
      const cleanAmount = amount.replace(/[^\d,\.]/g, '').replace(/[,\.]/g, '');

      return {
        section: {
          type: 'salary',
          content: 'Compensation',
          salaryMin: cleanAmount,
          salaryMax: cleanAmount,
          salaryCurrency: currency,
        },
        position: payRangePosition,
      };
    }
  }

  // If we didn't find salary in pay-range divs, try text patterns

  // Pattern 2: Look for salary in plain text paragraphs with common keywords
  // Match: "base salary range... is $200,000 - $300,000"
  const salaryPattern1 = /(?:salary|compensation|pay)(?:\s+range)?[:\s]+\$\s*([\d,]+)\s*(?:-|to|–|—)\s*\$\s*([\d,]+)/i;
  const salaryPattern2 = /\$\s*([\d,]+)\s*(?:-|to|–|—)\s*\$\s*([\d,]+)\s*(?:per|\/)\s*(?:year|annum|annually)/i;
  // New pattern for "is $X - $Y" format
  const salaryPattern3 = /(?:is|are)\s+\$\s*([\d,]+)\s*(?:-|to|–|—)\s*\$\s*([\d,]+)/i;

  let textMatch = salaryPattern1.exec(html);
  if (!textMatch) {
    textMatch = salaryPattern2.exec(html);
  }
  if (!textMatch) {
    textMatch = salaryPattern3.exec(html);
  }

  if (textMatch) {
    return {
      section: {
        type: 'salary',
        content: 'Salary Range',
        salaryMin: textMatch[1].replace(/,/g, ''),
        salaryMax: textMatch[2].replace(/,/g, ''),
        salaryCurrency: '$',
      },
      position: textMatch.index,
    };
  }

  return null;
}

/**
 * Parse HTML job description into structured sections
 * Preserves the order of content as it appears in the HTML
 */
function parseHTMLDescription(html: string): ParsedDescription {
  const sections: ParsedSection[] = [];

  // First, try to extract salary information before removing divs
  const salaryData = extractSalaryFromHTML(html);

  // Remove the entire pay transparency/salary section from the HTML to avoid duplicate content
  let cleanHtml = html;
  if (salaryData) {
    // Remove content-pay-transparency div and its contents
    cleanHtml = cleanHtml.replace(/<div[^>]*class=["'][^"']*content-pay-transparency[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
    // Also remove standalone job__pay-ranges sections that might exist
    cleanHtml = cleanHtml.replace(/<div[^>]*class=["'][^"']*job__pay-ranges[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
  }

  // Remove wrapper divs and closing div tags
  cleanHtml = cleanHtml
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '');

  // Find all block-level elements with their positions
  interface BlockElement {
    type: string;
    content: string;
    position: number;
    fullMatch: string;
    section?: ParsedSection; // For salary sections
  }

  const elements: BlockElement[] = [];

  // Find headings (h1-h6)
  const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let logisticsPosition: number | null = null;

  while ((match = headingRegex.exec(cleanHtml)) !== null) {
    const headingText = stripHTMLTags(match[2]);
    // Track position of "Logistics" heading to insert salary before it
    if (headingText.toLowerCase().includes('logistics') || headingText.toLowerCase().includes('logistique')) {
      logisticsPosition = match.index;
    }

    elements.push({
      type: 'heading',
      content: match[2],
      position: match.index,
      fullMatch: match[0],
    });
  }

  // Add salary element right before Logistics heading if found, otherwise use original position
  if (salaryData) {
    const salaryPosition = logisticsPosition !== null ? logisticsPosition - 1 : salaryData.position;

    elements.push({
      type: 'salary',
      content: '',
      position: salaryPosition,
      fullMatch: '',
      section: salaryData.section,
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

  // Also parse plain text lines as paragraphs/headings (for mixed HTML/text formats like Lever)
  // Split by newlines and check each line
  const lines = cleanHtml.split('\n');
  let currentPosition = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine && !/<[^>]+>/.test(trimmedLine)) {
      // Plain text line without HTML tags
      // Check if it looks like a heading (all caps with colon, or title case)
      const isAllCapsHeading = /^[A-Z][A-Z\s&,'-]+:$/.test(trimmedLine);

      if (isAllCapsHeading) {
        elements.push({
          type: 'heading',
          content: trimmedLine.replace(/:$/, ''),
          position: currentPosition,
          fullMatch: trimmedLine,
        });
      } else {
        // Regular text paragraph
        elements.push({
          type: 'paragraph',
          content: trimmedLine,
          position: currentPosition,
          fullMatch: trimmedLine,
        });
      }
    }

    currentPosition += line.length + 1; // +1 for newline
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

  // Find orphaned <li> tags (not wrapped in ul/ol) - common in Lever format
  // Look for consecutive <li> tags and group them
  const orphanedLiRegex = /(?:^|(?!<\/[uo]l>))((?:<li[^>]*>[\s\S]*?<\/li>\s*)+)/gi;
  while ((match = orphanedLiRegex.exec(cleanHtml)) !== null) {
    // Check if this match is already inside a ul/ol by checking if there's a ul/ol before it
    const beforeText = cleanHtml.substring(Math.max(0, match.index - 100), match.index);
    const hasListWrapper = /<(?:ul|ol)[^>]*>(?![\s\S]*<\/(?:ul|ol)>)/.test(beforeText);

    if (!hasListWrapper) {
      elements.push({
        type: 'list',
        content: match[1],
        position: match.index,
        fullMatch: match[0],
      });
    }
  }

  // Sort elements by position to preserve document order
  elements.sort((a, b) => a.position - b.position);

  // Convert elements to sections
  for (const element of elements) {
    if (element.type === 'salary') {
      // Add the pre-built salary section
      if (element.section) {
        sections.push(element.section);
      }
    } else if (element.type === 'heading') {
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
 * Process inline markdown formatting (bold, links, etc.)
 * Converts markdown to a format that can be rendered as React components
 */
function processInlineMarkdown(text: string): string {
  // Handle escaped newlines
  let processed = text.replace(/\\n/g, ' ');

  // For now, we'll keep the markdown syntax and let the component handle rendering
  // This preserves the information needed for proper rendering
  return processed;
}

/**
 * Parse plain text job description into structured sections
 * Supports markdown syntax: ###, **, *, [text](url)
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
        content: processInlineMarkdown(currentParagraph.trim()),
      });
      currentParagraph = '';
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({
        type: 'list',
        content: '',
        items: currentList.map(item => processInlineMarkdown(item)),
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

    // Check for markdown heading (### Heading)
    const markdownHeadingMatch = trimmedLine.match(/^#{1,6}\s+(.+)$/);
    if (markdownHeadingMatch) {
      flushParagraph();
      flushList();
      sections.push({
        type: 'heading',
        content: processInlineMarkdown(markdownHeadingMatch[1]),
      });
      continue;
    }

    // Check if line is a heading (capitalized words, no punctuation at end except colon)
    const isHeading =
      /^[A-Z][A-Za-z\s&,'-]+(?:[:']s)?$/.test(trimmedLine) &&
      !trimmedLine.endsWith('.') &&
      trimmedLine.length < 100 &&
      !trimmedLine.startsWith('*') &&
      !trimmedLine.startsWith('-');

    // Check if line is a bullet point (starts with -, *, •, or numbered)
    const isBullet = /^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);

    // Check if line contains a markdown link [text](url)
    const markdownLinkMatch = trimmedLine.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Check if line contains a plain URL
    const urlMatch = !markdownLinkMatch ? trimmedLine.match(/(https?:\/\/[^\s]+)/) : null;

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
    } else if (markdownLinkMatch) {
      // Check if the link is part of a paragraph or standalone
      const textBeforeLink = trimmedLine.substring(0, markdownLinkMatch.index).trim();
      const textAfterLink = trimmedLine.substring(
        (markdownLinkMatch.index || 0) + markdownLinkMatch[0].length
      ).trim();

      // If there's substantial text around the link, treat as paragraph
      if (textBeforeLink || textAfterLink) {
        flushList();
        if (currentParagraph) {
          currentParagraph += ' ' + processInlineMarkdown(trimmedLine);
        } else {
          currentParagraph = processInlineMarkdown(trimmedLine);
        }
      } else {
        // Standalone link
        flushParagraph();
        flushList();
        sections.push({
          type: 'link',
          content: markdownLinkMatch[1],
          url: markdownLinkMatch[2],
        });
      }
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
 * Check if text is markdown format
 * Detects common markdown patterns
 */
function isMarkdown(text: string): boolean {
  // Check for markdown headings (###), bold (**text**), or bullet points at start of lines
  return /^#{1,6}\s+/m.test(text) || /\*\*[^*]+\*\*/m.test(text) || /^\s*[\*\-]\s+/m.test(text);
}

/**
 * Clean markdown text by removing UI notation and escaped newlines
 */
function cleanMarkdown(text: string): string {
  // Remove _icon_name_ type notation (like _info_outline_)
  let cleaned = text.replace(/_[a-z_]+_/g, '');

  // Remove standalone X characters that appear after icon notation
  cleaned = cleaned.replace(/\n\nX(?=[A-Z])/g, '\n\n');

  // Replace escaped newlines with actual newlines
  cleaned = cleaned.replace(/\\n/g, '\n');

  // Clean up multiple consecutive newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Parse a job description text into structured sections
 * Handles both HTML and plain text input
 * @param text Raw job description text (HTML or plain text, may be entity-encoded)
 * @returns Parsed description with sections or raw markdown
 */
export function parseJobDescription(text: string): ParsedDescription & { isMarkdown?: boolean; rawMarkdown?: string } {
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

  // Check if input is markdown (before HTML check, as markdown can contain HTML)
  if (!isHTML(decodedText) && isMarkdown(decodedText)) {
    const cleaned = cleanMarkdown(decodedText);
    return {
      sections: [],
      isMarkdown: true,
      rawMarkdown: cleaned
    };
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
        case 'salary':
          const currency = section.salaryCurrency || '$';
          const min = section.salaryMin || '';
          const max = section.salaryMax || '';
          const salaryText = min === max
            ? `${currency}${min}`
            : `${currency}${min} - ${currency}${max}`;
          return `<div class="salary-section"><h3>💰 ${escapeHTML(section.content)}</h3><p class="salary-range">${escapeHTML(salaryText)}</p></div>`;
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
