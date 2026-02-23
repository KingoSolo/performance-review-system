/**
 * Frontend Logger Utility
 * Provides centralized error and event logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: any;
  error?: Error;
  userAgent?: string;
  url?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log informational messages
   */
  info(message: string, context?: string, data?: any) {
    this.log('info', message, context, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: string, data?: any) {
    this.log('warn', message, context, data);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error, context?: string, data?: any) {
    this.log('error', message, context, { ...data, error });

    // In production, you could send to error tracking service
    // e.g., Sentry, LogRocket, Datadog, etc.
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // this.sendToErrorTracking(message, error, context, data);
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, context, data);
    }
  }

  /**
   * Track user actions
   */
  trackAction(action: string, data?: any) {
    this.info(`User Action: ${action}`, 'UserTracking', data);

    // In production, send to analytics service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // this.sendToAnalytics(action, data);
    }
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      data,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Console output with styling
    const color = this.getColorByLevel(level);
    const emoji = this.getEmojiByLevel(level);
    const contextStr = context ? ` [${context}]` : '';

    console[level === 'debug' || level === 'info' ? 'log' : level](
      `${emoji} [${entry.timestamp}]${contextStr} ${message}`,
      data || ''
    );

    // Store in session storage for debugging (development only)
    if (this.isDevelopment && typeof window !== 'undefined') {
      this.storeLog(entry);
    }
  }

  /**
   * Get color by log level (for styled console output)
   */
  private getColorByLevel(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: 'color: #6c757d',
      info: 'color: #0dcaf0',
      warn: 'color: #ffc107',
      error: 'color: #dc3545',
    };
    return colors[level];
  }

  /**
   * Get emoji by log level
   */
  private getEmojiByLevel(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojis[level];
  }

  /**
   * Store log entry in session storage (development only)
   */
  private storeLog(entry: LogEntry) {
    try {
      const logs = this.getLogs();
      logs.push(entry);

      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.shift();
      }

      sessionStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (err) {
      // Ignore storage errors
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      const logsStr = sessionStorage.getItem('app_logs');
      return logsStr ? JSON.parse(logsStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('app_logs');
    }
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const trackAction = logger.trackAction.bind(logger);
