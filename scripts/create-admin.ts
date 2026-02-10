/**
 * Create Admin Script
 *
 * Promotes an existing user to admin by email address, or creates a new
 * admin user if one doesn't exist.
 *
 * Usage:
 *   npx ts-node scripts/create-admin.ts <email>
 *   npx tsx scripts/create-admin.ts <email>
 *
 * Examples:
 *   npx tsx scripts/create-admin.ts admin@assetguard.io
 */

import { PrismaClient, Role, KycStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Usage: npx tsx scripts/create-admin.ts <email>');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`❌ Invalid email format: "${email}"`);
    process.exit(1);
  }

  console.log(`\n🔍 Looking up user with email: ${email}...\n`);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ No user found with email "${email}".`);
    console.error('   The user must register first before being promoted to admin.');
    process.exit(1);
  }

  // Check if already an admin
  if (user.roles.includes('admin') && user.role === Role.ADMIN) {
    console.log(`ℹ️  User "${email}" is already an admin. No changes made.`);
    process.exit(0);
  }

  // Promote to admin + auto-approve KYC
  const updatedRoles = Array.from(new Set([...user.roles, 'admin', 'kyc_verified']));

  const updatedUser = await prisma.$transaction(async (tx) => {
    // Update user: role, roles, and KYC status
    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        roles: updatedRoles,
        role: Role.ADMIN,
        kycStatus: KycStatus.APPROVED,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        role: true,
        kycStatus: true,
      },
    });

    // Upsert KYC record so admin has an approved record
    await tx.kYCRecord.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName: user.name || 'Platform Administrator',
        idNumber: 'ADMIN-AUTO-APPROVED',
        documentUrls: [],
        reviewedAt: new Date(),
        reviewedBy: 'system:create-admin',
        adminNotes: 'Auto-approved: promoted to admin via create-admin script.',
      },
      update: {
        reviewedAt: new Date(),
        reviewedBy: 'system:create-admin',
        adminNotes: 'Auto-approved: promoted to admin via create-admin script.',
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'admin_promotion',
        details: JSON.stringify({
          promotedBy: 'script:create-admin',
          previousRoles: user.roles,
          newRoles: updatedRoles,
          kycAutoApproved: true,
        }),
        success: true,
      },
    });

    return updated;
  });

  console.log('✅ User promoted to admin successfully!\n');
  console.log('   ID:        ', updatedUser.id);
  console.log('   Email:     ', updatedUser.email);
  console.log('   Name:      ', updatedUser.name ?? '(not set)');
  console.log('   Roles:     ', updatedUser.roles.join(', '));
  console.log('   Role:      ', updatedUser.role);
  console.log('   KYC Status:', updatedUser.kycStatus, '(auto-approved)');
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
