import { prisma } from "../../../service/prisma.js";

const includeCategory = { category: true };

// Lista produtos aplicando filtros e paginação.
export async function listProducts({ search, categoryId, isActive, page, limit }) {
  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const skip = (page - 1) * limit;
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: includeCategory,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

// Busca um produto e sua categoria pelo identificador.
export function getProductById(id) {
  return prisma.product.findUnique({ where: { id }, include: includeCategory });
}

// Busca uma categoria ativa para associação com produto.
export function getActiveCategoryById(id) {
  return prisma.category.findFirst({ where: { id, isActive: true } });
}

// Cria um produto com saldo inicial igual a zero.
export function createProduct(data) {
  return prisma.product.create({ data, include: includeCategory });
}

// Atualiza somente os dados cadastrais do produto.
export function updateProduct(id, data) {
  return prisma.product.update({ where: { id }, data, include: includeCategory });
}
