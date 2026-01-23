'use client';

import { useEffect } from 'react';

export function ScrollablePageWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Override the body overflow to allow scrolling
    document.body.style.overflow = 'auto';

    // Cleanup: restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return <>{children}</>;
}
