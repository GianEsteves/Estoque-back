import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL deve ser configurado");
}

export const prisma = new PrismaClient();
