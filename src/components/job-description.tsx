'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import { parseJobDescription } from '@/utils/description-parser';

interface JobDescriptionProps {
  description: string;
  className?: string;
}

export function JobDescription({ description, className }: JobDescriptionProps) {
  const parsed = useMemo(() => parseJobDescription(description), [description]);

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
                {section.content}
              </h3>
            );

          case 'paragraph':
            return (
              <p
                key={index}
                className="text-[13px] md:text-[15px] text-white/80 leading-relaxed"
                style={{ textAlign: 'justify' }}
              >
                {section.content}
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
                    {item}
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
