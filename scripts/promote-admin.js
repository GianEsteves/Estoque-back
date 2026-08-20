import "dotenv/config";

import { prisma } from "../src/service/prisma.js";

// Lê o e-mail que será promovido a administrador.
const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Uso: npm run users:promote -- email@empresa.com");
  process.exitCode = 1;
} else {
  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "USER_PROMOTED_TO_ADMIN",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email },
    },
  });
  console.log(`${user.email} agora possui o perfil ${user.role}.`);
}

await prisma.$disconnect();
