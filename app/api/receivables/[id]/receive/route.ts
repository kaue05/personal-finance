import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const receiveSchema = z.object({
  accountId: z.string().min(1, "Selecione a conta"),

  receivedAt: z.string().min(1, "Informe a data do recebimento"),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATE");
  }

  return date;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();

    const parsed = receiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const receivedAt = parseDate(parsed.data.receivedAt);

    const result = await prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!receivable) {
        throw new Error("RECEIVABLE_NOT_FOUND");
      }

      if (receivable.status !== "PENDENTE") {
        throw new Error("RECEIVABLE_ALREADY_PROCESSED");
      }

      const account = await tx.bankAccount.findFirst({
        where: {
          id: parsed.data.accountId,
          userId: user.id,
          active: true,
        },
        include: {
          bank: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      const movement = await tx.movement.create({
        data: {
          userId: user.id,
          accountId: account.id,
          type: "ENTRADA",
          amount: receivable.amount,
          date: receivedAt,
          description: receivable.title,
          origin: "RECEBIMENTO",
          receivableId: receivable.id,
        },
      });

      const updatedReceivable = await tx.receivable.update({
        where: {
          id: receivable.id,
        },
        data: {
          status: "RECEBIDO",
          receivedAccountId: account.id,
          receivedAt,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          receivedAccount: {
            select: {
              id: true,
              name: true,
              bank: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        receivable: updatedReceivable,
        movement,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") {
      return NextResponse.json(
        { error: "Data de recebimento inválida" },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "RECEIVABLE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Recebimento não encontrado" },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "RECEIVABLE_ALREADY_PROCESSED"
    ) {
      return NextResponse.json(
        {
          error: "Este recebimento já foi processado",
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Conta inválida, inativa ou pertencente a outro usuário",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível registrar o recebimento" },
      { status: 500 },
    );
  }
}
