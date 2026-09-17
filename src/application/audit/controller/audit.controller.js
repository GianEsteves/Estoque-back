import { httpError } from "../../../service/app-error.js";
import { prisma } from "../../../service/prisma.js";
import { listAuditValidation } from "../validation/audit.validation.js";
const include = { actor: { select: { id: true, name: true, email: true } } };
export async function listAuditLogsController(request, response, next) {
  try {
    const filters = await listAuditValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (filters.from && filters.to && filters.from > filters.to)
      throw httpError(
        "Data inicial não pode ser posterior à data final",
        400,
        "INVALID_DATE_RANGE",
      );
    const where = {
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };
    const [auditLogs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    response.json({
      auditLogs,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function getAuditLogController(request, response, next) {
  try {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: request.params.id },
      include,
    });
    if (!auditLog)
      throw httpError("Auditoria não encontrada", 404, "AUDIT_LOG_NOT_FOUND");
    response.json({ auditLog });
  } catch (error) {
    next(error);
  }
}
