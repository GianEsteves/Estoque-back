import { prisma } from "../../../service/prisma.js";

// Lista clientes aplicando filtros e paginação.
export async function listCustomers({ search, isActive, page, limit }) {
  const where = {
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { document: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };
  const skip = (page - 1) * limit;
  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total };
}

// Busca um cliente pelo identificador.
export function getCustomerById(id) {
  return prisma.customer.findUnique({ where: { id } });
}

// Cria um cliente no banco local.
export function createCustomer(data) {
  return prisma.customer.create({ data });
}

// Atualiza dados ou estado de um cliente.
export function updateCustomer(id, data) {
  return prisma.customer.update({ where: { id }, data });
}
