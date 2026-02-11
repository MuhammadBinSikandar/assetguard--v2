/**
 * Client-side debug logger hook
 * Use this to log authentication and navigation events from React components
 * Logs are stored in sessionStorage and can be downloaded as a file
 */

'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

// Check if debug logging is enabled
const DEBUG_AUTH_ENABLED = 
  process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true' || 
  process.env.NODE_ENV === 'development';

const CLIENT_LOG_KEY = 'assetguard_client_logs';
const MAX_LOG_ENTRIES = 500; // Keep last 500 entries in memory

enum ClientLogLevel {
  DEBUG = 'CLIENT-DEBUG',
  INFO = 'CLIENT-INFO',
  WARN = 'CLIENT-WARN',
  ERROR = 'CLIENT-ERROR',
}

interface ClientLogEntry {
  timestamp: string;
  level: ClientLogLevel;
  category: string;
  message: string;
  data?: Record<string, any>;
  pathname?: string;
  userAgent?: string;
}

// Store logs in sessionStorage
function storeLogEntry(entry: ClientLogEntry): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingLogs = sessionStorage.getItem(CLIENT_LOG_KEY);
    const logs: ClientLogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];
    
    logs.push(entry);
    
    // Keep only the last MAX_LOG_ENTRIES
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - MAX_LOG_ENTRIES);
    }
    
    sessionStorage.setItem(CLIENT_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    // Ignore storage errors
  }
}

// Export logs as downloadable file
function downloadLogs(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const logs = sessionStorage.getItem(CLIENT_LOG_KEY);
    if (!logs) {
      console.log('No logs to download');
      return;
    }
    
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assetguard-client-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Client logs downloaded successfully');
  } catch (error) {
    console.error('Failed to download logs:', error);
  }
}

// Clear stored logs
function clearLogs(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CLIENT_LOG_KEY);
  console.log('🗑️ Client logs cleared');
}

// Expose to window for easy access
if (typeof window !== 'undefined') {
  (window as any).downloadClientLogs = downloadLogs;
  (window as any).clearClientLogs = clearLogs;
}

/**
 * Core client-side logging function
 */
function clientLog(
  level: ClientLogLevel,
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  if (!DEBUG_AUTH_ENABLED && level !== ClientLogLevel.ERROR) {
    return;
  }

  const timestamp = new Date().toISOString();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

  const logEntry: ClientLogEntry = {
    timestamp,
    level,
    category,
    message,
    data,
    pathname,
    userAgent,
  };

  // Store in sessionStorage
  storeLogEntry(logEntry);

  // Also log to console with colors (only if DEBUG_CONSOLE is enabled)
  if (process.env.NEXT_PUBLIC_DEBUG_CONSOLE === 'true') {
    const colors: Record<ClientLogLevel, string> = {
      [ClientLogLevel.DEBUG]: 'color: #00bcd4',
      [ClientLogLevel.INFO]: 'color: #4caf50',
      [ClientLogLevel.WARN]: 'color: #ff9800',
      [ClientLogLevel.ERROR]: 'color: #f44336',
    };

    const style = colors[level];
    console.log(
      `%c[${level}] [${category}] ${message}`,
      style,
      { timestamp, pathname, ...data }
    );
  }
}

/**
 * Hook for tracking page navigation and auth state
 */
export function useClientLogger() {
  const pathname = usePathname();

  useEffect(() => {
    clientLog(
      ClientLogLevel.INFO,
      'NAVIGATION',
      `Page loaded: ${pathname}`,
      { pathname }
    );
  }, [pathname]);

  // Memoize the returned object to prevent re-render cascades
  // when used as a dependency in useEffect
  return useMemo(() => ({
    logAuthCheck: (isAuthenticated: boolean, roles?: string[]) => {
      clientLog(
        ClientLogLevel.INFO,
        'AUTH_CHECK',
        `Auth check performed`,
        { isAuthenticated, roles, pathname }
      );
    },

    logRedirect: (from: string, to: string, reason: string) => {
      clientLog(
        ClientLogLevel.WARN,
        'REDIRECT',
        `Redirect: ${reason}`,
        { from, to, reason }
      );
    },

    logApiCall: (method: string, endpoint: string) => {
      clientLog(
        ClientLogLevel.DEBUG,
        'API_CALL',
        `${method} ${endpoint}`,
        { method, endpoint }
      );
    },

    logApiResponse: (method: string, endpoint: string, status: number, success: boolean, data?: any) => {
      clientLog(
        success ? ClientLogLevel.INFO : ClientLogLevel.WARN,
        'API_RESPONSE',
        `${method} ${endpoint} - ${status}`,
        { method, endpoint, status, success, data }
      );
    },

    logError: (error: string, context?: Record<string, any>) => {
      clientLog(
        ClientLogLevel.ERROR,
        'ERROR',
        error,
        { error, ...context }
      );
    },

    logAuthAction: (action: string, success: boolean, details?: Record<string, any>) => {
      clientLog(
        success ? ClientLogLevel.INFO : ClientLogLevel.WARN,
        'AUTH_ACTION',
        `${action} ${success ? 'succeeded' : 'failed'}`,
        { action, success, ...details }
      );
    },

    logRoleCheck: (requiredRoles: string[], userRoles: string[], hasAccess: boolean) => {
      clientLog(
        hasAccess ? ClientLogLevel.INFO : ClientLogLevel.WARN,
        'ROLE_CHECK',
        `Role check ${hasAccess ? 'passed' : 'FAILED'}`,
        { requiredRoles, userRoles, hasAccess }
      );
    },

    logTokenRefresh: (success: boolean) => {
      clientLog(
        success ? ClientLogLevel.INFO : ClientLogLevel.WARN,
        'TOKEN_REFRESH',
        `Token refresh ${success ? 'succeeded' : 'failed'}`,
        { success }
      );
    },

    logComponentMount: (componentName: string, props?: Record<string, any>) => {
      clientLog(
        ClientLogLevel.DEBUG,
        'COMPONENT',
        `${componentName} mounted`,
        { componentName, props }
      );
    },

    logUserAction: (action: string, details?: Record<string, any>) => {
      clientLog(
        ClientLogLevel.DEBUG,
        'USER_ACTION',
        action,
        details
      );
    },

    // Generic log function for custom messages
    log: (level: 'debug' | 'info' | 'warn' | 'error', category: string, message: string, data?: Record<string, any>) => {
      const logLevel = {
        debug: ClientLogLevel.DEBUG,
        info: ClientLogLevel.INFO,
        warn: ClientLogLevel.WARN,
        error: ClientLogLevel.ERROR,
      }[level];
      
      clientLog(logLevel, category, message, data);
    },
  }), [pathname]);
}

/**
 * Standalone logger for use outside of React components
 */
export const clientLogger = {
  debug: (category: string, message: string, data?: Record<string, any>) => {
    clientLog(ClientLogLevel.DEBUG, category, message, data);
  },

  info: (category: string, message: string, data?: Record<string, any>) => {
    clientLog(ClientLogLevel.INFO, category, message, data);
  },

  warn: (category: string, message: string, data?: Record<string, any>) => {
    clientLog(ClientLogLevel.WARN, category, message, data);
  },

  error: (category: string, message: string, data?: Record<string, any>) => {
    clientLog(ClientLogLevel.ERROR, category, message, data);
  },

  // Utility functions
  downloadLogs,
  clearLogs,
  
  getLogs: () => {
    if (typeof window === 'undefined') return [];
    const logs = sessionStorage.getItem(CLIENT_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  },
};
