import { prisma } from "../src/service/prisma.js";

const now = new Date();

// Localiza ou cria um usuário demonstrativo sem depender do Firebase.
async function upsertDemoUser(data) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: { name: data.name, phone: data.phone, role: data.role, isActive: true, emailVerified: true },
    create: { ...data, emailVerified: true, emailVerifiedAt: now, isActive: true },
  });
}

// Localiza ou cria uma categoria pela chave de negócio.
async function upsertCategory(name, description) {
  return prisma.category.upsert({ where: { name }, update: { description, isActive: true }, create: { name, description } });
}

// Localiza ou cria um produto e preserva o saldo já existente.
async function upsertProduct(data) {
  return prisma.product.upsert({
    where: { sku: data.sku },
    update: { name: data.name, description: data.description, categoryId: data.categoryId, costPrice: data.costPrice, salePrice: data.salePrice, minimumStock: data.minimumStock, isActive: true },
    create: data,
  });
}

// Cria uma movimentação apenas se a referência ainda não estiver registrada.
async function ensureMovement(data) {
  const existing = await prisma.stockMovement.findFirst({ where: { referenceId: data.referenceId, productId: data.productId } });
  if (existing) return existing;
  return prisma.stockMovement.create({ data });
}

// Popula o banco com registros coerentes para demonstrar todas as telas.
async function seed() {
  const [admin, seller, stockkeeper] = await Promise.all([
    upsertDemoUser({ firebaseUid: "demo-admin-uid", name: "Ana Administradora", email: "ana.admin@demo.local", phone: "11990000001", role: "ADMIN", mfaRequired: false }),
    upsertDemoUser({ firebaseUid: "demo-seller-uid", name: "Bruno Vendedor", email: "bruno.vendedor@demo.local", phone: "11990000002", role: "VENDEDOR", mfaRequired: false }),
    upsertDemoUser({ firebaseUid: "demo-stockkeeper-uid", name: "Carla Estoquista", email: "carla.estoque@demo.local", phone: "11990000003", role: "ESTOQUISTA", mfaRequired: false }),
  ]);
  const [electronics, office, cleaning] = await Promise.all([
    upsertCategory("Eletrônicos", "Acessórios e equipamentos eletrônicos"),
    upsertCategory("Escritório", "Materiais para uso administrativo"),
    upsertCategory("Limpeza", "Produtos de higiene e limpeza"),
  ]);
  const supplier = await prisma.supplier.upsert({ where: { document: "12345678000195" }, update: { isActive: true }, create: { legalName: "Distribuidora Modelo LTDA", tradeName: "Distribuidora Modelo", document: "12345678000195", email: "contato@distribuidorademo.local", phone: "1130004000", address: { street: "Avenida das Empresas", number: "500", neighborhood: "Centro", city: "São Paulo", state: "SP", zipCode: "01001000" } } });
  const customer = await prisma.customer.upsert({ where: { document: "39053344705" }, update: { isActive: true }, create: { name: "Mariana Cliente", document: "39053344705", email: "mariana@cliente.demo", phone: "11985556677", address: { street: "Rua das Flores", number: "123", neighborhood: "Jardins", city: "São Paulo", state: "SP", zipCode: "01415000" } } });
  const [keyboard, mouse, paper, detergent] = await Promise.all([
    upsertProduct({ name: "Teclado sem fio", sku: "DEMO-TEC-001", description: "Teclado compacto para demonstração", categoryId: electronics.id, costPrice: 75, salePrice: 129.9, minimumStock: 8, stockQuantity: 24 }),
    upsertProduct({ name: "Mouse óptico", sku: "DEMO-MOU-001", description: "Mouse USB ergonômico", categoryId: electronics.id, costPrice: 28, salePrice: 59.9, minimumStock: 12, stockQuantity: 5 }),
    upsertProduct({ name: "Papel A4 500 folhas", sku: "DEMO-PAP-001", description: "Resma de papel A4", categoryId: office.id, costPrice: 21, salePrice: 34.9, minimumStock: 15, stockQuantity: 42 }),
    upsertProduct({ name: "Detergente neutro", sku: "DEMO-DET-001", description: "Frasco de 500ml", categoryId: cleaning.id, costPrice: 2.5, salePrice: 5.9, minimumStock: 20, stockQuantity: 0 }),
  ]);
  const entry = await prisma.stockEntry.upsert({ where: { id: "demo-stock-entry-001" }, update: {}, create: { id: "demo-stock-entry-001", supplierId: supplier.id, userId: stockkeeper.id, receivedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), notes: "Entrada criada pela seed de demonstração", items: { create: [{ productId: keyboard.id, quantity: 30, unitCost: 75 }, { productId: mouse.id, quantity: 20, unitCost: 28 }, { productId: paper.id, quantity: 50, unitCost: 21 }, { productId: detergent.id, quantity: 30, unitCost: 2.5 }] } } });
  await Promise.all([
    ensureMovement({ productId: keyboard.id, userId: stockkeeper.id, type: "ENTRY", origin: "PURCHASE", quantity: 30, previousStock: 0, newStock: 30, referenceId: entry.id }),
    ensureMovement({ productId: mouse.id, userId: stockkeeper.id, type: "ENTRY", origin: "PURCHASE", quantity: 20, previousStock: 0, newStock: 20, referenceId: entry.id }),
    ensureMovement({ productId: paper.id, userId: stockkeeper.id, type: "ENTRY", origin: "PURCHASE", quantity: 50, previousStock: 0, newStock: 50, referenceId: entry.id }),
    ensureMovement({ productId: detergent.id, userId: stockkeeper.id, type: "ENTRY", origin: "PURCHASE", quantity: 30, previousStock: 0, newStock: 30, referenceId: entry.id }),
  ]);
  const sale = await prisma.sale.upsert({ where: { id: "demo-sale-001" }, update: {}, create: { id: "demo-sale-001", customerId: customer.id, userId: seller.id, paymentMethod: "PIX", discount: 5, subtotal: 294.7, total: 289.7, items: { create: [{ productId: keyboard.id, quantity: 2, unitPrice: 129.9, discount: 0, total: 259.8 }, { productId: paper.id, quantity: 1, unitPrice: 34.9, discount: 0, total: 34.9 }] } } });
  await Promise.all([
    ensureMovement({ productId: keyboard.id, userId: seller.id, type: "SALE", origin: "SALE", quantity: -2, previousStock: 30, newStock: 28, referenceId: sale.id }),
    ensureMovement({ productId: mouse.id, userId: seller.id, type: "SALE", origin: "SALE", quantity: -15, previousStock: 20, newStock: 5, referenceId: "demo-sale-mouse-history" }),
    ensureMovement({ productId: keyboard.id, userId: stockkeeper.id, type: "EXIT", origin: "MANUAL", quantity: -4, previousStock: 28, newStock: 24, reason: "Amostras para demonstração", referenceId: "demo-exit-keyboard" }),
    ensureMovement({ productId: paper.id, userId: seller.id, type: "SALE", origin: "SALE", quantity: -1, previousStock: 50, newStock: 49, referenceId: sale.id }),
    ensureMovement({ productId: paper.id, userId: stockkeeper.id, type: "EXIT", origin: "MANUAL", quantity: -7, previousStock: 49, newStock: 42, reason: "Uso interno", referenceId: "demo-exit-paper" }),
    ensureMovement({ productId: detergent.id, userId: stockkeeper.id, type: "EXIT", origin: "MANUAL", quantity: -30, previousStock: 30, newStock: 0, reason: "Produtos vencidos", referenceId: "demo-exit-detergent" }),
  ]);
  await prisma.auditLog.createMany({ data: [{ id: "demo-audit-seed-001", actorId: admin.id, action: "DEMO_SEED_EXECUTED", entityType: "System", metadata: { message: "Dados de demonstração disponíveis" } }], skipDuplicates: true });
  console.log("Seed concluída: usuários, catálogo, estoque, vendas e auditoria demonstrativos foram inseridos.");
}

seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
