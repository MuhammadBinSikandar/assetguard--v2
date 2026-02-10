/**
 * Debug Logger for Authentication and Routing Flow
 * 
 * Helps track user authentication, role verification, and routing decisions
 * Enabled in development and when DEBUG_AUTH is set to 'true'
 * Logs are written to files in the logs/ directory
 */

import prisma from '@/db/prismaClient';
import fs from 'fs';
import path from 'path';

// Check if debug logging is enabled
const DEBUG_AUTH_ENABLED = 
  process.env.DEBUG_AUTH === 'true' || 
  process.env.NODE_ENV === 'development';

// Log file configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const AUTH_LOG_FILE = path.join(LOG_DIR, 'auth.log');
const MIDDLEWARE_LOG_FILE = path.join(LOG_DIR, 'middleware.log');
const API_LOG_FILE = path.join(LOG_DIR, 'api.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'errors.log');
const COMBINED_LOG_FILE = path.join(LOG_DIR, 'combined.log');

// Ensure log directory exists
if (typeof window === 'undefined') {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create logs directory:', error);
  }
}

// File rotation - keep last 7 days
function rotateLogIfNeeded(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return;
    
    const stats = fs.statSync(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (stats.size > maxSize) {
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const backupPath = filePath.replace('.log', `_${timestamp}.log`);
      fs.renameSync(filePath, backupPath);
      
      // Clean up old logs (keep last 7 days)
      const logFiles = fs.readdirSync(LOG_DIR)
        .filter(f => f.includes('_') && f.endsWith('.log'))
        .map(f => ({ name: f, time: fs.statSync(path.join(LOG_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
      
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      logFiles.forEach(file => {
        if (file.time < sevenDaysAgo) {
          fs.unlinkSync(path.join(LOG_DIR, file.name));
        }
      });
    }
  } catch (error) {
    // Ignore rotation errors
  }
}

// Write to log file
function writeToFile(filePath: string, content: string): void {
  if (typeof window !== 'undefined') return; // Skip in browser
  
  try {
    rotateLogIfNeeded(filePath);
    fs.appendFileSync(filePath, content + '\n', { encoding: 'utf-8' });
  } catch (error) {
    console.error(`Failed to write to log file ${filePath}:`, error);
  }
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogCategory {
  AUTH = 'AUTH',
  MIDDLEWARE = 'MIDDLEWARE',
  ROUTING = 'ROUTING',
  TOKEN = 'TOKEN',
  SESSION = 'SESSION',
  ROLE_CHECK = 'ROLE_CHECK',
  API = 'API',
  UI = 'UI',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  pathname?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, any>
): void {
  if (!DEBUG_AUTH_ENABLED && level !== LogLevel.ERROR) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry: LogEntry = {
    timestamp,
    level,
    category,
    message,
    data,
  };

  // Format log message
  const logLine = `[${timestamp}] [${level}] [${category}] ${message}${
    data && Object.keys(data).length > 0 ? ' ' + JSON.stringify(data) : ''
  }`;

  // Write to appropriate log files (server-side only)
  if (typeof window === 'undefined') {
    // Always write to combined log
    writeToFile(COMBINED_LOG_FILE, logLine);

    // Write to category-specific log files
    if (category === LogCategory.AUTH || category === LogCategory.TOKEN || category === LogCategory.SESSION) {
      writeToFile(AUTH_LOG_FILE, logLine);
    }
    
    if (category === LogCategory.MIDDLEWARE || category === LogCategory.ROUTING || category === LogCategory.ROLE_CHECK) {
      writeToFile(MIDDLEWARE_LOG_FILE, logLine);
    }
    
    if (category === LogCategory.API) {
      writeToFile(API_LOG_FILE, logLine);
    }
    
    if (level === LogLevel.ERROR) {
      writeToFile(ERROR_LOG_FILE, logLine);
    }
  }

  // Also log to console with colors for development
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_CONSOLE === 'true') {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const categoryColor = '\x1b[35m'; // Magenta

    const prefix = `${colors[level]}[${level}]${reset} ${categoryColor}[${category}]${reset}`;
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (data && Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }
}

// Middleware Logging
export const middlewareLogger = {
  start: (pathname: string, hasToken: boolean) => {
    log(LogLevel.INFO, LogCategory.MIDDLEWARE, `Processing request`, {
      pathname,
      hasToken,
    });
  },

  tokenVerification: (success: boolean, user: any, pathname: string) => {
    log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.TOKEN,
      `Token verification ${success ? 'succeeded' : 'failed'}`,
      {
        pathname,
        userId: user?.userId,
        email: user?.email,
        roles: user?.roles,
        emailVerified: user?.emailVerified,
      }
    );
  },

  routeMatch: (pathname: string, isProtected: boolean, isPublic: boolean, routeConfig?: any) => {
    log(LogLevel.DEBUG, LogCategory.ROUTING, `Route analysis`, {
      pathname,
      isProtected,
      isPublic,
      routeConfig,
    });
  },

  roleCheck: (pathname: string, userRoles: string[], requiredRoles: string[], hasAccess: boolean) => {
    log(
      hasAccess ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.ROLE_CHECK,
      `Role verification ${hasAccess ? 'passed' : 'FAILED'}`,
      {
        pathname,
        userRoles,
        requiredRoles,
        hasAccess,
      }
    );
  },

  emailVerificationCheck: (pathname: string, emailVerified: boolean, required: boolean, isAdmin: boolean) => {
    log(LogLevel.DEBUG, LogCategory.AUTH, `Email verification check`, {
      pathname,
      emailVerified,
      required,
      isAdmin,
      bypassed: isAdmin && !emailVerified,
    });
  },

  redirect: (from: string, to: string, reason: string) => {
    log(LogLevel.WARN, LogCategory.ROUTING, `Redirect triggered: ${reason}`, {
      from,
      to,
      reason,
    });
  },

  allowed: (pathname: string, user: any) => {
    log(LogLevel.INFO, LogCategory.MIDDLEWARE, `Request allowed`, {
      pathname,
      userId: user?.userId,
      roles: user?.roles,
    });
  },
};

// Authentication Logging
export const authLogger = {
  loginAttempt: (email: string, ip?: string) => {
    log(LogLevel.INFO, LogCategory.AUTH, `Login attempt`, {
      email,
      ip,
    });
  },

  loginSuccess: (userId: string, email: string, roles: string[], emailVerified: boolean, ip?: string) => {
    log(LogLevel.INFO, LogCategory.AUTH, `Login successful`, {
      userId,
      email,
      roles,
      emailVerified,
      ip,
    });
  },

  loginFailure: (email: string, reason: string, ip?: string) => {
    log(LogLevel.WARN, LogCategory.AUTH, `Login failed: ${reason}`, {
      email,
      reason,
      ip,
    });
  },

  logout: (userId: string, email: string) => {
    log(LogLevel.INFO, LogCategory.AUTH, `User logged out`, {
      userId,
      email,
    });
  },

  tokenCreated: (userId: string, tokenType: 'access' | 'refresh', expiresAt: Date) => {
    log(LogLevel.DEBUG, LogCategory.TOKEN, `Token created`, {
      userId,
      tokenType,
      expiresAt: expiresAt.toISOString(),
    });
  },

  tokenRefresh: (userId: string, success: boolean) => {
    log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.TOKEN,
      `Token refresh ${success ? 'succeeded' : 'failed'}`,
      { userId }
    );
  },

  otpSent: (userId: string, email: string) => {
    log(LogLevel.INFO, LogCategory.AUTH, `OTP sent`, {
      userId,
      email,
    });
  },

  otpVerified: (userId: string, email: string, success: boolean) => {
    log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.AUTH,
      `OTP verification ${success ? 'succeeded' : 'failed'}`,
      { userId, email }
    );
  },
};

// Session Logging
export const sessionLogger = {
  created: (userId: string, sessionId: string, rememberMe: boolean) => {
    log(LogLevel.INFO, LogCategory.SESSION, `Session created`, {
      userId,
      sessionId,
      rememberMe,
    });
  },

  validated: (userId: string, sessionId: string, valid: boolean) => {
    log(
      valid ? LogLevel.DEBUG : LogLevel.WARN,
      LogCategory.SESSION,
      `Session validation ${valid ? 'passed' : 'FAILED'}`,
      { userId, sessionId }
    );
  },

  revoked: (sessionId: string, reason: string) => {
    log(LogLevel.INFO, LogCategory.SESSION, `Session revoked: ${reason}`, {
      sessionId,
      reason,
    });
  },
};

// API Logging
export const apiLogger = {
  request: (method: string, endpoint: string, userId?: string) => {
    log(LogLevel.DEBUG, LogCategory.API, `API request`, {
      method,
      endpoint,
      userId,
    });
  },

  response: (method: string, endpoint: string, status: number, success: boolean) => {
    log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.API,
      `API response`,
      { method, endpoint, status, success }
    );
  },

  error: (method: string, endpoint: string, error: string) => {
    log(LogLevel.ERROR, LogCategory.API, `API error: ${error}`, {
      method,
      endpoint,
      error,
    });
  },
};

// UI/Client-side Logging
export const uiLogger = {
  pageView: (pathname: string, userId?: string) => {
    log(LogLevel.DEBUG, LogCategory.UI, `Page view`, {
      pathname,
      userId,
    });
  },

  authCheck: (pathname: string, isAuthenticated: boolean, roles?: string[]) => {
    log(LogLevel.DEBUG, LogCategory.UI, `Client-side auth check`, {
      pathname,
      isAuthenticated,
      roles,
    });
  },

  redirectAttempt: (from: string, to: string, reason: string) => {
    log(LogLevel.INFO, LogCategory.UI, `Client redirect: ${reason}`, {
      from,
      to,
      reason,
    });
  },
};

// Database-persisted logs for critical events
export const persistentLogger = {
  async logAuthEvent(data: {
    userId?: string;
    action: string;
    success: boolean;
    details?: Record<string, any>;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          success: data.success,
          details: data.details ? JSON.stringify(data.details) : null,
          ip: data.ip || null,
          userAgent: data.userAgent || null,
        },
      });

      log(LogLevel.DEBUG, LogCategory.AUTH, `Audit log persisted: ${data.action}`, {
        userId: data.userId,
        action: data.action,
        success: data.success,
      });
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.AUTH, `Failed to persist audit log`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};

// Helper function to extract user info from request headers
export function getUserFromHeaders(headers: Headers): {
  userId?: string;
  email?: string;
  roles?: string[];
} | null {
  const userId = headers.get('x-user-id');
  const email = headers.get('x-user-email');
  const rolesHeader = headers.get('x-user-roles');
  
  if (!userId) return null;

  return {
    userId,
    email: email || undefined,
    roles: rolesHeader ? JSON.parse(rolesHeader) : undefined,
  };
}

// Export all loggers
export default {
  middleware: middlewareLogger,
  auth: authLogger,
  session: sessionLogger,
  api: apiLogger,
  ui: uiLogger,
  persistent: persistentLogger,
  getUserFromHeaders,
};
