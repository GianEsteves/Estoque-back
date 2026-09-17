import { httpError } from "../../../service/app-error.js";
import { prisma } from "../../../service/prisma.js";

const expectedSignals = {
  ENTRY: 1,
  EXIT: -1,
  SALE: -1,
  CANCELLATION: 1,
};

// Registra uma movimentação e atualiza o saldo na mesma transação.
export async function recordStockMovement({
  productId,
  userId,
  type,
  origin,
  quantity,
  reason,
  referenceId,
}) {
  return prisma.$transaction(
    (transaction) =>
      recordStockMovementInTransaction(transaction, {
        productId,
        userId,
        type,
        origin,
        quantity,
        reason,
        referenceId,
      }),
    { isolationLevel: "Serializable" },
  );
}

// Versão para operações compostas (entrada e venda) manterem tudo atômico.
export async function recordStockMovementInTransaction(
  transaction,
  { productId, userId, type, origin, quantity, reason, referenceId },
) {
  if (!Number.isInteger(quantity) || quantity === 0) {
    throw httpError(
      "Quantidade deve ser um inteiro diferente de zero",
      400,
      "INVALID_QUANTITY",
    );
  }

  if (expectedSignals[type] && Math.sign(quantity) !== expectedSignals[type]) {
    throw httpError(
      "Quantidade incompatível com o tipo de movimentação",
      400,
      "INVALID_MOVEMENT_QUANTITY",
    );
  }

  if (["EXIT", "ADJUSTMENT"].includes(type) && !reason?.trim()) {
    throw httpError(
      "Motivo é obrigatório para esta movimentação",
      400,
      "MOVEMENT_REASON_REQUIRED",
    );
  }

  const product = await transaction.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw httpError("Produto não encontrado", 404, "PRODUCT_NOT_FOUND");
  }

  const newStock = product.stockQuantity + quantity;

  if (newStock < 0) {
    throw httpError("Estoque insuficiente", 409, "INSUFFICIENT_STOCK");
  }

  const updated = await transaction.product.updateMany({
    where: { id: product.id, stockQuantity: product.stockQuantity },
    data: { stockQuantity: newStock },
  });

  if (updated.count !== 1) {
    throw httpError(
      "Saldo alterado simultaneamente; tente novamente",
      409,
      "STOCK_CONFLICT",
    );
  }

  return transaction.stockMovement.create({
    data: {
      productId,
      userId,
      type,
      origin,
      quantity,
      previousStock: product.stockQuantity,
      newStock,
      reason: reason?.trim() || null,
      referenceId: referenceId || null,
    },
  });
}
