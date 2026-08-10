import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const payExpenseSchema = z.object({
  accountId: z.string().min(1, "Selecione a conta"),

  paidAt: z.string().min(1, "Informe a data do pagamento"),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();

    const parsed = payExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const paidAt = parseDate(parsed.data.paidAt);

    if (Number.isNaN(paidAt.getTime())) {
      return NextResponse.json(
        { error: "Data de pagamento inválida" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!expense) {
        throw new Error("EXPENSE_NOT_FOUND");
      }

      if (expense.status !== "PENDENTE") {
        throw new Error("EXPENSE_ALREADY_PROCESSED");
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
          type: "SAIDA",
          amount: expense.amount,
          date: paidAt,
          description: expense.title,
          origin: "GASTO",
          expenseId: expense.id,
        },
      });

      const updatedExpense = await tx.expense.update({
        where: {
          id: expense.id,
        },
        data: {
          status: "PAGO",
          paidAccountId: account.id,
          paidAt,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          paidAccount: {
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
        expense: updatedExpense,
        movement,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EXPENSE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Gasto não encontrado" },
          { status: 404 },
        );
      }

      if (error.message === "EXPENSE_ALREADY_PROCESSED") {
        return NextResponse.json(
          {
            error: "Este gasto já foi pago ou cancelado",
          },
          { status: 409 },
        );
      }

      if (error.message === "ACCOUNT_NOT_FOUND") {
        return NextResponse.json(
          {
            error: "Conta inválida, inativa ou pertencente a outro usuário",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Não foi possível registrar o pagamento" },
      { status: 500 },
    );
  }
}
