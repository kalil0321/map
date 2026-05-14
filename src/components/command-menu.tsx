'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import './command-menu.css';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
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
    href: '/applied-jobs',
    label: 'Applied Jobs',
    description: 'Track your applications',
  },
  {
    href: '/',
    label: 'Map',
    description: 'Interactive job map',
  },
];

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, mounted]);

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

  if (!mounted || !isOpen) return null;

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
                    router.push(item.href);
                  }}
                >
                  <div className="command-item-content">
                    <div className="command-item-label">{item.label}</div>
                    <div className="command-item-description">{item.description}</div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
