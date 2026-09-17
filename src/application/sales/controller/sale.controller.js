import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import { prisma } from "../../../service/prisma.js";
import { recordStockMovementInTransaction } from "../../movements/service/stock-movement.service.js";
import {
  cancelSaleValidation,
  createSaleValidation,
  listSalesValidation,
} from "../validation/sale.validation.js";

const saleInclude = {
  customer: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
  items: {
    include: { product: { select: { id: true, name: true, sku: true } } },
  },
};
function makeWhere(filters) {
  return {
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };
}
export async function listSalesController(request, response, next) {
  try {
    const filters = await listSalesValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (filters.from && filters.to && filters.from > filters.to)
      throw httpError(
        "Data inicial não pode ser posterior à data final",
        400,
        "INVALID_DATE_RANGE",
      );
    const where = makeWhere(filters);
    const [sales, total] = await prisma.$transaction([
      prisma.sale.findMany({
        where,
        include: saleInclude,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.sale.count({ where }),
    ]);
    response.json({
      sales,
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
export async function getSaleController(request, response, next) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: request.params.id },
      include: saleInclude,
    });
    if (!sale) throw httpError("Venda não encontrada", 404, "SALE_NOT_FOUND");
    response.json({ sale });
  } catch (error) {
    next(error);
  }
}
export async function createSaleController(request, response, next) {
  try {
    const data = await createSaleValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const seen = new Set();
    if (
      data.items.some(
        (item) => seen.has(item.productId) || !seen.add(item.productId),
      )
    )
      throw httpError(
        "Um produto não pode ser repetido na venda",
        400,
        "DUPLICATE_PRODUCT",
      );
    const sale = await prisma.$transaction(
      async (tx) => {
        if (
          data.customerId &&
          !(await tx.customer.findFirst({
            where: { id: data.customerId, isActive: true },
          }))
        )
          throw httpError(
            "Cliente inválido ou inativo",
            400,
            "INVALID_CUSTOMER",
          );
        const products = await tx.product.findMany({
          where: {
            id: { in: data.items.map((item) => item.productId) },
            isActive: true,
          },
        });
        if (products.length !== data.items.length)
          throw httpError(
            "Produto inválido ou inativo",
            400,
            "INVALID_PRODUCT",
          );
        const calculatedItems = data.items.map((item) => {
          const product = products.find(
            (candidate) => candidate.id === item.productId,
          );
          const lineTotal =
            Number(product.salePrice) * item.quantity - item.discount;
          if (lineTotal < 0)
            throw httpError(
              "Desconto do item não pode exceder o valor",
              400,
              "INVALID_DISCOUNT",
            );
          return { ...item, unitPrice: product.salePrice, total: lineTotal };
        });
        const subtotal = calculatedItems.reduce(
          (sum, item) => sum + Number(item.unitPrice) * item.quantity,
          0,
        );
        if (data.discount > subtotal)
          throw httpError(
            "Desconto não pode exceder o subtotal",
            400,
            "INVALID_DISCOUNT",
          );
        const created = await tx.sale.create({
          data: {
            customerId: data.customerId || null,
            userId: request.auth.user.id,
            paymentMethod: data.paymentMethod,
            discount: data.discount,
            subtotal,
            total:
              subtotal -
              data.discount -
              calculatedItems.reduce((sum, item) => sum + item.discount, 0),
            items: {
              create: calculatedItems.map(
                ({ productId, quantity, unitPrice, discount, total }) => ({
                  productId,
                  quantity,
                  unitPrice,
                  discount,
                  total,
                }),
              ),
            },
          },
          include: saleInclude,
        });
        for (const item of calculatedItems)
          await recordStockMovementInTransaction(tx, {
            productId: item.productId,
            userId: request.auth.user.id,
            type: "SALE",
            origin: "SALE",
            quantity: -item.quantity,
            referenceId: created.id,
          });
        return created;
      },
      { isolationLevel: "Serializable" },
    );
    await audit({
      actorId: request.auth.user.id,
      action: "SALE_CREATED",
      entityType: "Sale",
      entityId: sale.id,
      metadata: { total: sale.total, itemCount: data.items.length },
    });
    response.status(201).json({ sale });
  } catch (error) {
    next(error);
  }
}
export async function cancelSaleController(request, response, next) {
  try {
    const data = await cancelSaleValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const sale = await prisma.$transaction(
      async (tx) => {
        const found = await tx.sale.findUnique({
          where: { id: request.params.id },
          include: { items: true },
        });
        if (!found)
          throw httpError("Venda não encontrada", 404, "SALE_NOT_FOUND");
        if (found.status === "CANCELLED")
          throw httpError("Venda já cancelada", 409, "SALE_ALREADY_CANCELLED");
        const updated = await tx.sale.update({
          where: { id: found.id },
          data: {
            status: "CANCELLED",
            cancellationReason: data.reason,
            cancelledAt: new Date(),
          },
          include: saleInclude,
        });
        for (const item of found.items)
          await recordStockMovementInTransaction(tx, {
            productId: item.productId,
            userId: request.auth.user.id,
            type: "CANCELLATION",
            origin: "CANCELLATION",
            quantity: item.quantity,
            reason: data.reason,
            referenceId: found.id,
          });
        return updated;
      },
      { isolationLevel: "Serializable" },
    );
    await audit({
      actorId: request.auth.user.id,
      action: "SALE_CANCELLED",
      entityType: "Sale",
      entityId: sale.id,
      metadata: { reason: data.reason },
    });
    response.json({ sale });
  } catch (error) {
    next(error);
  }
}
export async function salesReportController(request, response, next) {
  try {
    const filters = await listSalesValidation.validate(request.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    const where = makeWhere(filters);
    const sales = await prisma.sale.findMany({
      where,
      include: { items: true },
    });
    const completed = sales.filter((sale) => sale.status === "COMPLETED");
    const products = new Map();
    for (const sale of completed)
      for (const item of sale.items) {
        const current = products.get(item.productId) || {
          productId: item.productId,
          quantity: 0,
          total: 0,
        };
        current.quantity += item.quantity;
        current.total += Number(item.total);
        products.set(item.productId, current);
      }
    response.json({
      filters,
      totals: {
        count: sales.length,
        completedCount: completed.length,
        cancelledCount: sales.length - completed.length,
        grossRevenue: completed.reduce(
          (sum, sale) => sum + Number(sale.subtotal),
          0,
        ),
        discounts: completed.reduce(
          (sum, sale) =>
            sum +
            Number(sale.discount) +
            sale.items.reduce((sum, item) => sum + Number(item.discount), 0),
          0,
        ),
        netRevenue: completed.reduce(
          (sum, sale) => sum + Number(sale.total),
          0,
        ),
      },
      topProducts: [...products.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
}
