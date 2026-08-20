import { prisma } from "../../../service/prisma.js";

/**
 * Busca um usuario pelo endereco de e-mail unico.
 */
// Busca um usuário pelo e-mail.
export function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Busca um usuario pelo identificador gerado pelo Firebase.
 */
// Busca um usuário pelo identificador Firebase.
export function getUserByFirebaseUid(firebaseUid) {
  return prisma.user.findUnique({ where: { firebaseUid } });
}

/**
 * Cria o perfil local associado a uma conta Firebase.
 */
// Cria o perfil local de um usuário.
export function createUser(data) {
  return prisma.user.create({ data });
}

/**
 * Remove um perfil local criado durante um cadastro incompleto.
 */
// Exclui um perfil criado em um cadastro incompleto.
export function deleteUser(userId) {
  return prisma.user.delete({ where: { id: userId } });
}

/**
 * Sincroniza no perfil local o estado de verificacao retornado pelo Firebase.
 */
// Atualiza o estado de verificação do e-mail.
export function updateEmailVerification(userId, emailVerified) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified,
      emailVerifiedAt: emailVerified ? new Date() : null,
    },
  });
}

// Atualiza dados administrativos de um usuário.
export function updateUser(userId, data) {
  return prisma.user.update({ where: { id: userId }, data });
}

// Lista usuários para a administração.
export function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      mfaRequired: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}
