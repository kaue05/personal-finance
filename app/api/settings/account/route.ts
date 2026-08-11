import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const { confirm } = body;

    if (confirm !== "DELETE_MY_ACCOUNT") {
      return NextResponse.json(
        { error: "Confirmação necessária" },
        { status: 400 },
      );
    }

    // Deletar tudo em cascata
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

      prisma.session.deleteMany({
        where: {
          userId: user.id,
        },
      }),

      prisma.account.deleteMany({
        where: {
          userId: user.id,
        },
      }),
    ]);

    // Por último, deletar o usuário
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir a conta" },
      { status: 500 },
    );
  }
}
