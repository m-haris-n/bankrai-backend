import { PrismaClient } from "@/generated/prisma"

PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Log all queries if the DEBUG environment variable is set
if (process.env.DEBUG === "true") {
    (prisma.$on as any)("query", async (e: any) => {
      console.log(`${e.query} ${e.params}`);
    });
  }
  

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma