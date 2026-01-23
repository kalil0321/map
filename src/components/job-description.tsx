

import clsx from 'clsx';
import { parseJobDescription } from '@/utils/description-parser';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface JobDescriptionProps {
  description: string;
  className?: string;
}

/**
 * Process text with markdown formatting into React elements
 * Handles **bold** and [link](url) syntax
 */
function renderMarkdownText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Combined regex to match both bold (**text**) and links [text](url)
  const markdownRegex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  const matches = Array.from(text.matchAll(markdownRegex));

  for (const match of matches) {
    // Add text before the match
    if (match.index !== undefined && match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Check if it's bold or link
    if (match[2]) {
      // Bold text: **text**
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3] && match[4]) {
      // Link: [text](url)
      parts.push(
        <a
          key={key++}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          {match[3]}
        </a>
      );
    }

    if (match.index !== undefined) {
      lastIndex = match.index + match[0].length;
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function JobDescription({ description, className }: JobDescriptionProps) {
  const parsed = parseJobDescription(description);

  // If markdown, render using react-markdown
  if (parsed.isMarkdown && parsed.rawMarkdown) {
    return (
      <div className={clsx('job-description markdown-content space-y-4', className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-[18px] md:text-[20px] font-semibold text-white mt-8 mb-4 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-[17px] md:text-[19px] font-semibold text-white mt-7 mb-3 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-[16px] md:text-[18px] font-semibold text-white mt-6 mb-3 first:mt-0">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-[15px] md:text-[17px] font-semibold text-white mt-5 mb-2 first:mt-0">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="text-[13px] md:text-[15px] text-white/80 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="space-y-2 pl-5 list-disc">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-2 pl-5 list-decimal">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-[13px] md:text-[15px] text-white/80 leading-relaxed">
                {children}
              </li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-white">
                {children}
              </strong>
            ),
          }}
        >
          {parsed.rawMarkdown}
        </ReactMarkdown>
      </div>
    );
  }

  // Otherwise, render parsed sections as before
  if (!parsed.sections.length) {
    return null;
  }

  return (
    <div className={clsx('job-description space-y-4', className)}>
      {parsed.sections.map((section, index) => {
        switch (section.type) {
          case 'heading':
            return (
              <h3
                key={index}
                className="text-[16px] md:text-[18px] font-semibold text-white mt-6 mb-3 first:mt-0"
                style={{ textAlign: 'justify' }}
              >
                {renderMarkdownText(section.content)}
              </h3>
            );

          case 'paragraph':
            return (
              <p
                key={index}
                className="text-[13px] md:text-[15px] text-white/80 leading-relaxed"
                style={{ textAlign: 'justify' }}
              >
                {renderMarkdownText(section.content)}
              </p>
            );

          case 'list':
            return (
              <ul key={index} className="space-y-2 pl-5">
                {section.items?.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-[13px] md:text-[15px] text-white/80 leading-relaxed list-disc"
                    style={{ textAlign: 'justify' }}
                  >
                    {renderMarkdownText(item)}
                  </li>
                ))}
              </ul>
            );

          case 'link':
            return (
              <p
                key={index}
                className="text-[13px] md:text-[15px] text-white/80 leading-relaxed"
                style={{ textAlign: 'justify' }}
              >
                {section.content}{' '}
                <a
                  href={section.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline transition-colors break-all"
                >
                  {section.url}
                </a>
              </p>
            );

          case 'salary':
            const currency = section.salaryCurrency || '$';
            const min = section.salaryMin || '';
            const max = section.salaryMax || '';

            // Format with commas: 385000 -> 385,000
            const formatWithCommas = (num: string) => {
              return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            const salaryText = min === max
              ? `${currency}${formatWithCommas(min)}`
              : `${currency}${formatWithCommas(min)} - ${currency}${formatWithCommas(max)}`;

            return (
              <div key={index} className="mt-6 mb-3 first:mt-0">
                <h3 className="text-[16px] md:text-[18px] font-semibold text-white mb-2">
                  {section.content}
                </h3>
                <p className="text-[13px] md:text-[15px] text-white/80">
                  {salaryText}
                </p>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
