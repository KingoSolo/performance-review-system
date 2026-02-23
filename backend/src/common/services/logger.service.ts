import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

/**
 * Custom Logger Service wrapping NestJS Logger
 * Provides structured logging with context and timestamps
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  /**
   * Log informational messages
   */
  log(message: string, context?: string) {
    this.printMessage('LOG', message, context);
  }

  /**
   * Log error messages
   */
  error(message: string, trace?: string, context?: string) {
    this.printMessage('ERROR', message, context);
    if (trace) {
      console.error(trace);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: string) {
    this.printMessage('WARN', message, context);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.printMessage('DEBUG', message, context);
    }
  }

  /**
   * Log verbose messages (only in development)
   */
  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.printMessage('VERBOSE', message, context);
    }
  }

  /**
   * Format and print log message
   */
  private printMessage(level: string, message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    const color = this.getColorByLevel(level);
    const reset = '\x1b[0m';

    console.log(`${color}[${timestamp}] [${level}] [${ctx}]${reset} ${message}`);
  }

  /**
   * Get ANSI color code by log level
   */
  private getColorByLevel(level: string): string {
    const colors: Record<string, string> = {
      LOG: '\x1b[32m',     // Green
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
      DEBUG: '\x1b[36m',   // Cyan
      VERBOSE: '\x1b[35m', // Magenta
    };
    return colors[level] || '\x1b[0m';
  }
}
