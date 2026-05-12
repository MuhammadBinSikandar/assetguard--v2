import prisma from './db/prismaClient.js';

async function main() {
  const props = await prisma.property.findMany();
  console.log(props.map(p => ({
    id: p.id,
    status: p.status,
    mintAddress: p.mintAddress,
    mintSignature: p.mintSignature
  })));
}

main().finally(() => prisma.$disconnect());
