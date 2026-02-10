/**
 * Auth Diagnostic Script
 *
 * Check the authentication status and roles of a user by email
 *
 * Usage:
 *   npx tsx scripts/check-auth.ts <email>
 *
 * Examples:
 *   npx tsx scripts/check-auth.ts admin@assetguard.io
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Usage: npx tsx scripts/check-auth.ts <email>');
    process.exit(1);
  }

  console.log(`\n🔍 Checking authentication status for: ${email}...\n`);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      _count: {
        select: {
          refreshTokens: {
            where: {
              revoked: false,
              expiresAt: {
                gt: new Date(),
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.error(`❌ No user found with email "${email}".`);
    process.exit(1);
  }

  console.log('✅ User found!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('USER DETAILS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ID:               ${user.id}`);
  console.log(`  Email:            ${user.email}`);
  console.log(`  Name:             ${user.name ?? '(not set)'}`);
  console.log(`  Created:          ${user.createdAt.toISOString()}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('AUTHENTICATION STATUS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Email Verified:   ${user.emailVerified ? '✅ YES' : '❌ NO'}`);
  console.log(`  2FA Enabled:      ${user.twoFactorEnabled ? '✅ YES' : '❌ NO'}`);
  console.log(`  Failed Attempts:  ${user.failedLoginAttempts}`);
  console.log(`  Account Locked:   ${user.lockedUntil ? `🔒 YES (until ${user.lockedUntil.toISOString()})` : '✅ NO'}`);
  console.log(`  Active Sessions:  ${user._count.refreshTokens}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('ROLES & PERMISSIONS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Primary Role:     ${user.role}`);
  console.log(`  All Roles:        ${user.roles.join(', ')}`);
  console.log(`  Is Admin:         ${user.roles.includes('admin') ? '✅ YES' : '❌ NO'}`);
  console.log(`  KYC Verified:     ${user.roles.includes('kyc_verified') ? '✅ YES' : '❌ NO'}`);
  console.log(`  KYC Status:       ${user.kycStatus}`);
  console.log('');

  // Check if user can access admin panel
  const canAccessAdmin = user.roles.includes('admin') && user.emailVerified;
  console.log('═══════════════════════════════════════════════════════');
  console.log('ADMIN ACCESS CHECK');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Can Access Admin: ${canAccessAdmin ? '✅ YES' : '❌ NO'}`);
  
  if (!canAccessAdmin) {
    console.log('\n  Reasons for NO access:');
    if (!user.roles.includes('admin')) {
      console.log('    ❌ User does not have "admin" role');
    }
    if (!user.emailVerified) {
      console.log('    ❌ Email is not verified');
    }
  }
  console.log('');

  // Recent audit logs
  const recentLogs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (recentLogs.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('RECENT ACTIVITY (Last 5)');
    console.log('═══════════════════════════════════════════════════════');
    recentLogs.forEach((log, index) => {
      const status = log.success ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${log.action.padEnd(20)} ${log.createdAt.toISOString()}`);
      if (log.ip) console.log(`     IP: ${log.ip}`);
    });
    console.log('');
  }

  // Active sessions
  if (user._count.refreshTokens > 0) {
    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('ACTIVE SESSIONS');
    console.log('═══════════════════════════════════════════════════════');
    sessions.forEach((session, index) => {
      console.log(`  ${index + 1}. Device: ${session.device || 'Unknown'}`);
      console.log(`     IP: ${session.ip || 'Unknown'}`);
      console.log(`     Created: ${session.createdAt.toISOString()}`);
      console.log(`     Expires: ${session.expiresAt.toISOString()}`);
      console.log('');
    });
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
