import { prisma } from "../../../service/prisma.js";

/**
 * Busca um usuario pelo endereco de e-mail unico.
 */
export function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Busca um usuario pelo identificador gerado pelo Firebase.
 */
export function getUserByFirebaseUid(firebaseUid) {
  return prisma.user.findUnique({ where: { firebaseUid } });
}

/**
 * Cria o perfil local associado a uma conta Firebase.
 */
export function createUser(data) {
  return prisma.user.create({ data });
}

/**
 * Remove um perfil local criado durante um cadastro incompleto.
 */
export function deleteUser(userId) {
  return prisma.user.delete({ where: { id: userId } });
}

/**
 * Sincroniza no perfil local o estado de verificacao retornado pelo Firebase.
 */
export function updateEmailVerification(userId, emailVerified) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified,
      emailVerifiedAt: emailVerified ? new Date() : null,
    },
  });
}
