import { prisma } from "../../../service/prisma.js";

function criticality(product) {
  if (product.stockQuantity <= 0) return "CRITICAL";
  if (product.stockQuantity <= Math.ceil(product.minimumStock / 2))
    return "HIGH";
  return "LOW";
}
export async function lowStockController(request, response, next) {
  try {
    const categoryId = request.query.categoryId?.trim();
    const severity = request.query.severity;
    const products = await prisma.product.findMany({
      where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { stockQuantity: "asc" },
    });
    const alerts = products
      .filter((product) => product.stockQuantity <= product.minimumStock)
      .map((product) => ({
        product,
        currentQuantity: product.stockQuantity,
        minimumQuantity: product.minimumStock,
        severity: criticality(product),
      }))
      .filter((alert) => !severity || alert.severity === severity);
    response.json({ alerts, total: alerts.length });
  } catch (error) {
    next(error);
  }
}
export async function alertSummaryController(_request, response, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { stockQuantity: true, minimumStock: true },
    });
    const alerts = products.filter(
      (product) => product.stockQuantity <= product.minimumStock,
    );
    response.json({
      total: alerts.length,
      critical: alerts.filter((product) => criticality(product) === "CRITICAL")
        .length,
      high: alerts.filter((product) => criticality(product) === "HIGH").length,
      low: alerts.filter((product) => criticality(product) === "LOW").length,
    });
  } catch (error) {
    next(error);
  }
}
