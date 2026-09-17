import { audit } from "../../../service/audit.js";
import { httpError } from "../../../service/app-error.js";
import { prisma } from "../../../service/prisma.js";
import {
  recordStockMovement,
  recordStockMovementInTransaction,
} from "../../movements/service/stock-movement.service.js";
import {
  balanceValidation,
  entryValidation,
  exitValidation,
} from "../validation/inventory.validation.js";

export async function listBalancesController(request, response, next) {
  try {
    const filters = await balanceValidation.validate(request.query, {
      stripUnknown: true,
    });
    const where = {
      isActive: true,
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { sku: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    const balances = products
      .map((product) => ({
        ...product,
        isLowStock: product.stockQuantity <= product.minimumStock,
      }))
      .filter(
        (product) =>
          typeof filters.isLowStock !== "boolean" ||
          product.isLowStock === filters.isLowStock,
      );
    const total = balances.length;
    response.json({
      balances: balances.slice(
        (filters.page - 1) * filters.limit,
        filters.page * filters.limit,
      ),
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
export async function getBalanceController(request, response, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: request.params.productId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product)
      throw httpError("Produto não encontrado", 404, "PRODUCT_NOT_FOUND");
    response.json({
      balance: {
        ...product,
        isLowStock: product.stockQuantity <= product.minimumStock,
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function createEntryController(request, response, next) {
  try {
    const data = await entryValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const duplicates = new Set();
    if (
      data.items.some(
        (item) =>
          duplicates.has(item.productId) || !duplicates.add(item.productId),
      )
    )
      throw httpError(
        "Um produto não pode ser repetido na entrada",
        400,
        "DUPLICATE_PRODUCT",
      );
    const entry = await prisma.$transaction(
      async (tx) => {
        const supplier = await tx.supplier.findFirst({
          where: { id: data.supplierId, isActive: true },
        });
        if (!supplier)
          throw httpError(
            "Fornecedor inválido ou inativo",
            400,
            "INVALID_SUPPLIER",
          );
        for (const item of data.items) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, isActive: true },
          });
          if (!product)
            throw httpError(
              "Produto inválido ou inativo",
              400,
              "INVALID_PRODUCT",
            );
        }
        const created = await tx.stockEntry.create({
          data: {
            supplierId: data.supplierId,
            userId: request.auth.user.id,
            receivedAt: data.receivedAt,
            notes: data.notes,
            items: { create: data.items.map((item) => ({ ...item })) },
          },
          include: { items: true },
        });
        for (const item of data.items)
          await recordStockMovementInTransaction(tx, {
            productId: item.productId,
            userId: request.auth.user.id,
            type: "ENTRY",
            origin: "PURCHASE",
            quantity: item.quantity,
            referenceId: created.id,
          });
        return created;
      },
      { isolationLevel: "Serializable" },
    );
    await audit({
      actorId: request.auth.user.id,
      action: "STOCK_ENTRY_CREATED",
      entityType: "StockEntry",
      entityId: entry.id,
      metadata: { itemCount: data.items.length },
    });
    response.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
}
export async function createExitController(request, response, next) {
  try {
    const data = await exitValidation.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const movement = await recordStockMovement({
      productId: data.productId,
      userId: request.auth.user.id,
      type: data.type,
      origin: data.type === "ADJUSTMENT" ? "ADJUSTMENT" : "MANUAL",
      quantity: -data.quantity,
      reason: data.reason,
    });
    await audit({
      actorId: request.auth.user.id,
      action: "STOCK_EXIT_CREATED",
      entityType: "StockMovement",
      entityId: movement.id,
      metadata: {
        productId: data.productId,
        quantity: data.quantity,
        type: data.type,
      },
    });
    response.status(201).json({ movement });
  } catch (error) {
    next(error);
  }
}
