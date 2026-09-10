import { prisma } from "../../../service/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  profilePhoto: true,
  role: true,
  isActive: true,
  mfaRequired: true,
  emailVerified: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

// Lista usuários aplicando filtros e paginação.
export async function listUsers({ search, role, isActive, page, limit }) {
  const where = {
    ...(role ? { role } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

// Busca um usuário pelo identificador interno.
export function getUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

// Busca um usuário pelo e-mail para evitar duplicidade.
export function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

// Cria o perfil local ligado à conta Firebase.
export function createUser(data) {
  return prisma.user.create({ data, select: userSelect });
}

// Atualiza dados e permissões do perfil local.
export function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data, select: userSelect });
}

// Conta administradores ativos para preservar acesso ao sistema.
export function countActiveAdmins(excludeId) {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}
