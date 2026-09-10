import { prisma } from "../../../service/prisma.js";

// Lista fornecedores utilizando filtros e paginação.
export async function listSuppliers({ search, isActive, page, limit }) {
  const where = {
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { legalName: { contains: search, mode: "insensitive" } },
            { tradeName: { contains: search, mode: "insensitive" } },
            { document: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };
  const skip = (page - 1) * limit;
  const [suppliers, total] = await prisma.$transaction([
    prisma.supplier.findMany({
      where,
      orderBy: { legalName: "asc" },
      skip,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { suppliers, total };
}

// Busca um fornecedor pelo identificador.
export function getSupplierById(id) {
  return prisma.supplier.findUnique({ where: { id } });
}

// Cria um fornecedor no banco local.
export function createSupplier(data) {
  return prisma.supplier.create({ data });
}

// Atualiza dados ou estado de um fornecedor.
export function updateSupplier(id, data) {
  return prisma.supplier.update({ where: { id }, data });
}
