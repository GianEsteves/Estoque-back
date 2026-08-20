import { prisma } from "./prisma.js";

// Registra uma ação relevante para auditoria.
export function audit({ actorId, action, entityType, entityId, metadata }) {
  return prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata },
  });
}
