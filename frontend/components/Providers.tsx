'use client';

import { ReactNode, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { initializeGlobalErrorHandlers } from '@/lib/global-error-handler';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * Includes ErrorBoundary and other global providers
 */
export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Initialize global error handlers once on mount
    initializeGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
