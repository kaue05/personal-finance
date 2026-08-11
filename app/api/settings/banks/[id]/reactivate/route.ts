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

    const bank = await prisma.bank.findFirst({
      where: {
        id,
        userId: user.id,
        active: false,
      },
    });

    if (!bank) {
      return NextResponse.json(
        { error: "Banco não encontrado ou já está ativo" },
        { status: 404 },
      );
    }

    await prisma.bank.update({
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
      { error: "Não foi possível reativar o banco" },
      { status: 500 },
    );
  }
}
