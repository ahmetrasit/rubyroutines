/**
 * Centralized logging utility for Ruby Routines
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Payment failed', { error, userId: '123' });
 *   logger.debug('Debug info', { data });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Log sensitive operations that should be audited
   * (e.g., billing, role changes, data exports)
   */
  audit(message: string, context: LogContext): void {
    const auditContext = {
      ...context,
      audit: true,
      timestamp: new Date().toISOString(),
    };
    console.info(this.formatMessage('info', `[AUDIT] ${message}`, auditContext));

    // In production, you would send this to an audit logging service
    // e.g., CloudWatch, Datadog, Sentry, etc.
  }
}

export const logger = new Logger();
