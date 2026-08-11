import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const { confirm } = body;

    if (confirm !== "DELETE_ALL_DATA") {
      return NextResponse.json(
        { error: "Confirmação necessária" },
        { status: 400 },
      );
    }

    // Deletar em cascata (dependendo do schema)
    await Promise.all([
      prisma.expense.deleteMany({
        where: {
          userId: user.id,
        },
      }),

      prisma.receivable.deleteMany({
        where: {
          userId: user.id,
        },
      }),

      prisma.movement.deleteMany({
        where: {
          userId: user.id,
        },
      }),

      prisma.bankAccount.deleteMany({
        where: {
          userId: user.id,
        },
      }),

      prisma.bank.deleteMany({
        where: {
          userId: user.id,
        },
      }),

      prisma.category.deleteMany({
        where: {
          userId: user.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível limpar os dados" },
      { status: 500 },
    );
  }
}
