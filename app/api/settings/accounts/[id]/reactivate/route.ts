import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const account = await prisma.bankAccount.findFirst({
      where: {
        id,
        userId: user.id,
        active: false,
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          error: "Conta não encontrada ou já está ativa",
        },
        { status: 404 },
      );
    }

    await prisma.bankAccount.update({
      where: {
        id,
      },
      data: {
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível reativar a conta" },
      { status: 500 },
    );
  }
}
