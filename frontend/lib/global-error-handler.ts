/**
 * Global Error Handler
 * Catches unhandled errors and promise rejections
 */

import { logger } from './logger';

/**
 * Initialize global error handlers
 * Should be called once on app startup
 */
export function initializeGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Handle unhandled errors
  window.addEventListener('error', (event: ErrorEvent) => {
    logger.error(
      `Unhandled Error: ${event.message}`,
      event.error,
      'GlobalErrorHandler',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );

    // Prevent default browser error handling in production
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.error(
      `Unhandled Promise Rejection: ${event.reason}`,
      event.reason instanceof Error ? event.reason : undefined,
      'GlobalErrorHandler',
      {
        promise: event.promise,
        reason: event.reason,
      }
    );

    // Prevent default browser error handling in production
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
  });

  logger.info('Global error handlers initialized', 'GlobalErrorHandler');
}
