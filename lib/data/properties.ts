import prisma from '@/db/prismaClient';
import { PropertyStatus, Prisma } from '@prisma/client';

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminPropertiesFilters {
  status?: string;
  page: number;
  limit: number;
  search?: string;
}

// ── Action → PropertyStatus mapping ──────────────────────────────────────────

const ACTION_TO_STATUS: Record<string, PropertyStatus> = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
};

// ── getAdminPropertiesList ───────────────────────────────────────────────────

export async function getAdminPropertiesList(filters: AdminPropertiesFilters) {
  const { status, page, limit, search } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.PropertyWhereInput = {};

  // Status filter
  if (status && Object.values(PropertyStatus).includes(status as PropertyStatus)) {
    where.status = status as PropertyStatus;
  }

  // Search filter — case-insensitive on referenceId, propertyAddress, ownerName
  if (search && search.trim()) {
    where.OR = [
      { referenceId: { contains: search, mode: 'insensitive' } },
      { propertyAddress: { contains: search, mode: 'insensitive' } },
      { ownerName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: {
        id: true,
        referenceId: true,
        propertyAddress: true,
        ownerName: true,
        borough: true,
        block: true,
        lot: true,
        status: true,
        submittedAt: true,
        estimatedPriceUSD: true,
        walletAddress: true,
        _count: { select: { documents: true } },
      },
      orderBy: { submittedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: data.map((p) => ({
      id: p.id,
      referenceId: p.referenceId,
      propertyAddress: p.propertyAddress,
      ownerName: p.ownerName,
      borough: p.borough,
      block: p.block,
      lot: p.lot,
      status: p.status,
      submittedAt: p.submittedAt,
      estimatedPriceUSD: p.estimatedPriceUSD,
      walletAddress: p.walletAddress,
      documentCount: p._count.documents,
    })),
    total,
    page,
    totalPages,
  };
}

// ── getAdminPropertyDetail ───────────────────────────────────────────────────

export async function getAdminPropertyDetail(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      documents: {
        select: {
          id: true,
          documentType: true,
          fileName: true,
          fileUrl: true,
          mimeType: true,
          fileSizeBytes: true,
          status: true,
          uploadedAt: true,
          verifiedAt: true,
          verifiedBy: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
      owner: {
        select: {
          name: true,
          email: true,
          walletAddress: true,
          kycStatus: true,
        },
      },
    },
  });

  return property;
}

// ── getPropertyStatusCounts ──────────────────────────────────────────────────

export async function getPropertyStatusCounts() {
  const [total, pending, underReview, approved, rejected] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: 'PENDING' } }),
    prisma.property.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.property.count({ where: { status: 'APPROVED' } }),
    prisma.property.count({ where: { status: 'REJECTED' } }),
  ]);

  return { total, pending, underReview, approved, rejected };
}

// ── updatePropertyStatus ─────────────────────────────────────────────────────

export async function updatePropertyStatus(
  id: string,
  action: string,
  adminId: string,
  notes?: string,
) {
  const newStatus = ACTION_TO_STATUS[action];
  if (!newStatus) return null;

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) return null;

  const updated = await prisma.$transaction(async (tx) => {
    // Update property status
    const property = await tx.property.update({
      where: { id },
      data: {
        status: newStatus,
        adminNotes: notes || null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Insert status history
    await tx.propertyStatusHistory.create({
      data: {
        propertyId: id,
        fromStatus: existing.status,
        toStatus: newStatus,
        changedBy: adminId,
        reason: notes,
      },
    });

    // Update document statuses based on action
    if (newStatus === 'APPROVED') {
      await tx.propertyDocument.updateMany({
        where: { propertyId: id },
        data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedBy: adminId },
      });
    } else if (newStatus === 'REJECTED') {
      await tx.propertyDocument.updateMany({
        where: { propertyId: id },
        data: { status: 'REJECTED' },
      });
    }

    // Stub token minting
    if (newStatus === 'APPROVED') {
      console.log(`[STUB] Mint tokens for property ${id}`);
    }

    return property;
  });

  return updated;
}
