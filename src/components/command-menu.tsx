'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Command } from 'cmdk';
import './command-menu.css';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    href: '/jobs',
    label: 'Jobs',
    description: 'Browse all job listings',
  },
  {
    href: '/companies',
    label: 'Companies',
    description: 'View all companies',
  },
  {
    href: '/saved-jobs',
    label: 'Saved Jobs',
    description: 'Your bookmarked jobs',
  },
  {
    href: '/',
    label: 'Map',
    description: 'Interactive job map',
  },
];

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-menu-overlay">
      <div className="command-menu-backdrop" onClick={onClose} />
      <div className="command-menu-container">
        <Command label="Command Menu">
          <Command.Input placeholder="Type to search..." />
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>
            <Command.Group heading="Navigation">
              {menuItems.map((item) => (
                <Command.Item
                  key={item.href}
                  value={`${item.label} ${item.description}`}
                  onSelect={() => {
                    onClose();
                  }}
                  asChild
                >
                  <Link href={item.href} prefetch={true}>
                    <div className="command-item-content">
                      <div className="command-item-label">{item.label}</div>
                      <div className="command-item-description">{item.description}</div>
                    </div>
                  </Link>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
