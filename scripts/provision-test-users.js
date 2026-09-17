import { getAuth } from "firebase-admin/auth";
import "../src/service/firebase-admin.js";
import { prisma } from "../src/service/prisma.js";

const users = [
  { name: "Administrador de Teste", email: "admin.teste@estoque.local", password: "Admin#Estoque2026", phone: "11990001001", role: "ADMIN" },
  { name: "Vendedor de Teste", email: "vendedor.teste@estoque.local", password: "Vendedor#Estoque2026", phone: "11990001002", role: "VENDEDOR" },
  { name: "Estoquista de Teste", email: "estoquista.teste@estoque.local", password: "Estoquista#Estoque2026", phone: "11990001003", role: "ESTOQUISTA" },
];

// Cria ou atualiza uma conta Firebase e mantém o perfil local sincronizado.
async function provisionUser(data) {
  const auth = getAuth();
  let firebaseUser;
  try {
    firebaseUser = await auth.getUserByEmail(data.email);
    firebaseUser = await auth.updateUser(firebaseUser.uid, { displayName: data.name, password: data.password, emailVerified: true, disabled: false });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    firebaseUser = await auth.createUser({ email: data.email, password: data.password, displayName: data.name, emailVerified: true, disabled: false });
  }
  return prisma.user.upsert({
    where: { email: data.email },
    update: { firebaseUid: firebaseUser.uid, name: data.name, phone: data.phone, role: data.role, isActive: true, emailVerified: true, emailVerifiedAt: new Date() },
    create: { firebaseUid: firebaseUser.uid, name: data.name, email: data.email, phone: data.phone, role: data.role, isActive: true, emailVerified: true, emailVerifiedAt: new Date() },
  });
}

// Provisiona todas as contas de teste solicitadas.
async function main() {
  const created = await Promise.all(users.map(provisionUser));
  console.log(`Contas de teste provisionadas: ${created.map((user) => user.email).join(", ")}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
