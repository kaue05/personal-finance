import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const updateDebtSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe o título da dívida")
    .max(150, "O título deve possuir no máximo 150 caracteres"),

  totalAmount: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, "Informe um valor válido")
    .refine((value) => Number(value.replace(",", ".")) > 0, {
      message: "O valor deve ser maior que zero",
    }),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateDebtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    if (!debt) {
      return NextResponse.json(
        { error: "Dívida não encontrada" },
        { status: 404 },
      );
    }

    const normalizedAmount = parsed.data.totalAmount.replace(",", ".");

    const hasPayments = debt._count.payments > 0;
    const changingTotal = normalizedAmount !== debt.totalAmount.toString();

    if (hasPayments && changingTotal) {
      return NextResponse.json(
        {
          error:
            "O valor total não pode ser alterado depois que a dívida possui pagamentos",
        },
        { status: 409 },
      );
    }

    const updatedDebt = await prisma.debt.update({
      where: {
        id,
      },
      data: {
        title: parsed.data.title,
        totalAmount: normalizedAmount,
      },
    });

    return NextResponse.json(updatedDebt);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar a dívida" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    if (!debt) {
      return NextResponse.json(
        { error: "Dívida não encontrada" },
        { status: 404 },
      );
    }

    if (debt._count.payments > 0) {
      return NextResponse.json(
        {
          error: "Esta dívida possui pagamentos e não pode ser excluída",
        },
        { status: 409 },
      );
    }

    await prisma.debt.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir a dívida" },
      { status: 500 },
    );
  }
}
