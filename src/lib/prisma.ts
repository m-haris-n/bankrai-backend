/**
 * Exports the Prisma client. This is only available in the server. Importing
 * this in frontend code will throw an error.
 *
 * @example
 * ```ts
 * import { prisma } from "@/prisma/client";
 * ```
 */
import { PrismaClient } from "@/generated/prisma"; 
export type { PrismaClient };

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
  });
};

declare const globalThis: {
  prismaGlobal: PrismaClient;
} & typeof global;

export const prisma =
  globalThis.prismaGlobal ?? (prismaClientSingleton() as PrismaClient);

// Log all queries if the DEBUG environment variable is set
if (process.env.DEBUG === "true") {
  (prisma.$on as any)("query", async (e: any) => {
    console.log(`${e.query} ${e.params}`);
  });
}

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
