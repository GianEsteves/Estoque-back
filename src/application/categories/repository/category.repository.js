import { prisma } from "../../../service/prisma.js";

export async function listCategories({ search, isActive, page, limit }) {
  const where = {
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };
  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.category.count({ where }),
  ]);
  return { categories, total };
}
export function getCategoryById(id) {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
}
export function createCategory(data) {
  return prisma.category.create({ data });
}
export function updateCategory(id, data) {
  return prisma.category.update({ where: { id }, data });
}
