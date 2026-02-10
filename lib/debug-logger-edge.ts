/**
 * Edge Runtime Compatible Debug Logger
 * 
 * Lightweight logger for Next.js middleware (Edge Runtime)
 * Only uses console.log since Edge Runtime doesn't support fs/path
 */

// Check if debug logging is enabled
const DEBUG_AUTH_ENABLED = 
  process.env.DEBUG_AUTH === 'true' || 
  process.env.NODE_ENV === 'development';

const DEBUG_CONSOLE = process.env.DEBUG_CONSOLE === 'true';

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
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, any>;
  pathname?: string;
}

/**
 * Core logging function (Edge Runtime compatible)
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
  
  // Format log message
  const logLine = `[${timestamp}] [${level}] [${category}] ${message}${
    data && Object.keys(data).length > 0 ? ' ' + JSON.stringify(data) : ''
  }`;

  // Log to console only (Edge Runtime compatible)
  if (DEBUG_CONSOLE || level === LogLevel.ERROR) {
    console.log(logLine);
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

export default {
  middleware: middlewareLogger,
};
