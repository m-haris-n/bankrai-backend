
import { prisma } from "@/lib/prisma";
import { updateTransactionHistory } from "@/utils/helpers";
import { NextResponse } from "next/server";

export const GET = (async (req: any) => {
  if (req.method !== "GET") {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }
  const userId = req.headers.get('x-user-id')!

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }
  await updateTransactionHistory(userId);

  return NextResponse.json(
    { message: 'Transactions refreshed' },
    { status: 200 }
  )
});