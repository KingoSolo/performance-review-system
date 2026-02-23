import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTP Request Logger Middleware
 * Logs all incoming requests with timing and status information
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Log request
    console.log(`➜ ${method} ${originalUrl} - ${ip}`);

    // Capture response
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const statusColor = this.getStatusColor(statusCode);
      const reset = '\x1b[0m';

      console.log(
        `${statusColor}← ${method} ${originalUrl} ${statusCode}${reset} - ${duration}ms - ${userAgent.substring(0, 50)}`
      );

      // Log errors
      if (statusCode >= 400) {
        console.error(`⚠️  Error Response: ${method} ${originalUrl} - Status ${statusCode}`);
      }
    });

    next();
  }

  /**
   * Get ANSI color code by HTTP status code
   */
  private getStatusColor(statusCode: number): string {
    if (statusCode >= 500) return '\x1b[31m'; // Red for 5xx
    if (statusCode >= 400) return '\x1b[33m'; // Yellow for 4xx
    if (statusCode >= 300) return '\x1b[36m'; // Cyan for 3xx
    if (statusCode >= 200) return '\x1b[32m'; // Green for 2xx
    return '\x1b[0m'; // Default
  }
}
