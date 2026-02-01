import prisma from '@/db/prismaClient';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'password_reset'
  | 'email_verify'
  | 'token_refresh'
  | 'token_revoke'
  | 'failed_login'
  | 'account_locked'
  | 'session_revoked'
  | 'password_changed'
  | 'resend_otp';

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  details?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  success?: boolean;
}

/**
 * Create an audit log entry
 * @param data - Audit log data
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    if (process.env.AUDIT_LOG_ENABLED !== 'true') {
      // Only log to console if audit logging is disabled
      if (process.env.DEBUG_MODE === 'true') {
        console.log('[AUDIT]', data);
      }
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        details: data.details ? JSON.stringify(data.details) : null,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
        success: data.success ?? true,
      },
    });
  } catch (error) {
    // Don't throw errors for audit logging failures
    // Just log to console
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs for a user
 * @param userId - User ID
 * @param limit - Maximum number of logs to return
 * @returns Array of audit logs
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  try {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Clean up old audit logs
 * Should be run periodically (e.g., via cron job)
 */
export async function cleanupOldAuditLogs(): Promise<void> {
  try {
    const retentionDays = parseInt(
      process.env.AUDIT_LOG_RETENTION_DAYS || '90',
      10
    );
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old audit logs`);
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
  }
}

/**
 * Debug logger for development
 * @param message - Log message
 * @param data - Additional data to log
 */
export function debugLog(message: string, data?: unknown): void {
  if (process.env.DEBUG_MODE === 'true') {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

/**
 * Security logger for important security events
 * @param message - Log message
 * @param data - Additional data to log
 */
export function securityLog(message: string, data?: unknown): void {
  console.warn(`[SECURITY] ${message}`, data || '');
}
