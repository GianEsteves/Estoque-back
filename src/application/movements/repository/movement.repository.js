import { prisma } from "../../../service/prisma.js";

const includeRelations = {
  product: { select: { id: true, name: true, sku: true } },
  user: { select: { id: true, name: true, email: true } },
};

// Lista movimentações imutáveis aplicando filtros e paginação.
export async function listMovements({
  productId,
  userId,
  type,
  origin,
  from,
  to,
  page,
  limit,
}) {
  const where = {
    ...(productId ? { productId } : {}),
    ...(userId ? { userId } : {}),
    ...(type ? { type } : {}),
    ...(origin ? { origin } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };
  const skip = (page - 1) * limit;
  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      include: includeRelations,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { movements, total };
}

// Busca uma movimentação e seus relacionamentos pelo identificador.
export function getMovementById(id) {
  return prisma.stockMovement.findUnique({
    where: { id },
    include: includeRelations,
  });
}
