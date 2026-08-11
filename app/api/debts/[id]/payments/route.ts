import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const paymentSchema = z.object({
  accountId: z.string().min(1, "Selecione a conta"),

  amount: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, "Informe um valor válido")
    .refine((value) => Number(value.replace(",", ".")) > 0, {
      message: "O pagamento deve ser maior que zero",
    }),

  date: z.string().min(1, "Informe a data"),

  note: z.string().trim().max(300).optional(),
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
    const { id: debtId } = await context.params;
    const body = await request.json();

    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const paymentDate = parseDate(parsed.data.date);
    const paymentAmount = new Prisma.Decimal(
      parsed.data.amount.replace(",", "."),
    );

    const result = await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findFirst({
        where: {
          id: debtId,
          userId: user.id,
        },
      });

      if (!debt) {
        throw new Error("DEBT_NOT_FOUND");
      }

      if (debt.status === "QUITADA") {
        throw new Error("DEBT_ALREADY_PAID");
      }

      const account = await tx.bankAccount.findFirst({
        where: {
          id: parsed.data.accountId,
          userId: user.id,
          active: true,
        },
      });

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      const paidAggregate = await tx.debtPayment.aggregate({
        where: {
          debtId: debt.id,
          userId: user.id,
        },
        _sum: {
          amount: true,
        },
      });

      const alreadyPaid = paidAggregate._sum.amount ?? new Prisma.Decimal(0);

      const remaining = debt.totalAmount.minus(alreadyPaid);

      if (paymentAmount.greaterThan(remaining)) {
        throw new Error("PAYMENT_ABOVE_REMAINING");
      }

      const payment = await tx.debtPayment.create({
        data: {
          userId: user.id,
          debtId: debt.id,
          accountId: account.id,
          amount: paymentAmount,
          date: paymentDate,
          note: parsed.data.note || null,
        },
      });

      await tx.movement.create({
        data: {
          userId: user.id,
          accountId: account.id,
          type: "SAIDA",
          amount: paymentAmount,
          date: paymentDate,
          description: `Pagamento da dívida: ${debt.title}`,
          origin: "PAGAMENTO_DIVIDA",
          debtPaymentId: payment.id,
        },
      });

      const newPaid = alreadyPaid.plus(paymentAmount);

      const newStatus = newPaid.greaterThanOrEqualTo(debt.totalAmount)
        ? "QUITADA"
        : "ABERTA";

      const updatedDebt = await tx.debt.update({
        where: {
          id: debt.id,
        },
        data: {
          status: newStatus,
          lastPaymentAt: paymentDate,
        },
      });

      return {
        debt: updatedDebt,
        payment,
      };
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    if (error instanceof Error && error.message === "DEBT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Dívida não encontrada" },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "DEBT_ALREADY_PAID") {
      return NextResponse.json(
        { error: "Esta dívida já está quitada" },
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

    if (error instanceof Error && error.message === "PAYMENT_ABOVE_REMAINING") {
      return NextResponse.json(
        {
          error: "O pagamento não pode ser maior que o valor restante",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível registrar o pagamento" },
      { status: 500 },
    );
  }
}
