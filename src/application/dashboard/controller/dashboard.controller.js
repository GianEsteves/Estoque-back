import { prisma } from "../../../service/prisma.js";
function range(query) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getFullYear(), to.getMonth(), 1);
  return { from, to };
}
async function topProducts(from, to) {
  const items = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: { sale: { status: "COMPLETED", createdAt: { gte: from, lte: to } } },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    select: { id: true, name: true, sku: true },
  });
  return items.map((item) => ({
    product: products.find((product) => product.id === item.productId),
    quantity: item._sum.quantity,
    revenue: item._sum.total,
  }));
}
export async function dashboardController(request, response, next) {
  try {
    const { from, to } = range(request.query);
    const isSeller = request.auth.user.role === "VENDEDOR";
    const salesWhere = {
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
      ...(isSeller ? { userId: request.auth.user.id } : {}),
    };
    const sales = await prisma.sale.findMany({
      where: salesWhere,
      select: { subtotal: true, discount: true, total: true },
    });
    const result = {
      period: { from, to },
      sales: {
        count: sales.length,
        gross: sales.reduce((sum, sale) => sum + Number(sale.subtotal), 0),
        discounts: sales.reduce((sum, sale) => sum + Number(sale.discount), 0),
        total: sales.reduce((sum, sale) => sum + Number(sale.total), 0),
      },
      topProducts: await topProducts(from, to),
    };
    if (!isSeller) {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { stockQuantity: true, minimumStock: true },
      });
      result.stock = {
        products: products.length,
        units: products.reduce(
          (sum, product) => sum + product.stockQuantity,
          0,
        ),
        lowStock: products.filter(
          (product) => product.stockQuantity <= product.minimumStock,
        ).length,
      };
    }
    response.json(result);
  } catch (error) {
    next(error);
  }
}
export async function topProductsController(request, response, next) {
  try {
    const { from, to } = range(request.query);
    response.json({
      period: { from, to },
      products: await topProducts(from, to),
    });
  } catch (error) {
    next(error);
  }
}
export async function stockSummaryController(_request, response, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { stockQuantity: true, minimumStock: true },
    });
    response.json({
      products: products.length,
      units: products.reduce((sum, product) => sum + product.stockQuantity, 0),
      lowStock: products.filter(
        (product) => product.stockQuantity <= product.minimumStock,
      ).length,
      outOfStock: products.filter((product) => product.stockQuantity === 0)
        .length,
    });
  } catch (error) {
    next(error);
  }
}
