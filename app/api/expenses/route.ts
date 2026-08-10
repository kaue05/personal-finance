import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const createExpenseSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria"),

  title: z
    .string()
    .trim()
    .min(2, "O título deve possuir pelo menos 2 caracteres")
    .max(150),

  amount: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, "Informe um valor válido")
    .refine((value) => Number(value.replace(",", ".")) > 0, {
      message: "O valor deve ser maior que zero",
    }),

  dueDate: z.string().min(1, "Informe a data de vencimento"),

  installmentTotal: z.coerce
    .number()
    .int()
    .min(1, "A quantidade mínima é 1")
    .max(120, "A quantidade máxima é 120"),
});

function parseDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATE");
  }

  return date;
}

function parseCents(value: string) {
  const normalized = value.replace(",", ".");
  const [integerPart, decimalPart = ""] = normalized.split(".");

  const cents = decimalPart.padEnd(2, "0").slice(0, 2);

  return BigInt(integerPart) * 100n + BigInt(cents);
}

function formatCents(cents: bigint) {
  const integerPart = cents / 100n;
  const decimalPart = (cents % 100n).toString().padStart(2, "0");

  return `${integerPart}.${decimalPart}`;
}

function addMonthsKeepingDay(originalDate: Date, monthsToAdd: number) {
  const originalDay = originalDate.getUTCDate();

  const result = new Date(originalDate);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + monthsToAdd);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return result;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");

    const validStatuses = ["PENDENTE", "PAGO", "CANCELADO"] as const;

    const statusFilter = validStatuses.includes(
      status as (typeof validStatuses)[number],
    )
      ? (status as (typeof validStatuses)[number])
      : undefined;

    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        ...(statusFilter ? { status: statusFilter } : {}),
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
        movement: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          installmentNumber: "asc",
        },
      ],
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { categoryId, title, amount, dueDate, installmentTotal } =
      parsed.data;

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: user.id,
        type: "EXPENSE",
        active: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          error: "Categoria de gasto inválida ou inativa",
        },
        { status: 400 },
      );
    }

    const firstDueDate = parseDate(dueDate);
    const totalCents = parseCents(amount);

    if (totalCents <= 0n) {
      return NextResponse.json(
        { error: "O valor deve ser maior que zero" },
        { status: 400 },
      );
    }

    const installmentCount = installmentTotal;
    const baseCents = totalCents / BigInt(installmentCount);
    const remainder = totalCents % BigInt(installmentCount);

    if (baseCents <= 0n) {
      return NextResponse.json(
        {
          error: "O valor total deve ser suficiente para todas as parcelas",
        },
        { status: 400 },
      );
    }

    const groupId = installmentCount > 1 ? randomUUID() : null;

    const expenses = await prisma.$transaction(async (tx) => {
      const createdExpenses = [];

      for (let index = 0; index < installmentCount; index++) {
        // Os primeiros centavos restantes são distribuídos
        // nas primeiras parcelas.
        const installmentCents =
          baseCents + (BigInt(index) < remainder ? 1n : 0n);

        const installmentDate = addMonthsKeepingDay(firstDueDate, index);

        const expense = await tx.expense.create({
          data: {
            userId: user.id,
            categoryId,
            title,
            amount: formatCents(installmentCents),
            dueDate: installmentDate,
            status: "PENDENTE",

            installmentGroupId: groupId,
            installmentNumber: installmentCount > 1 ? index + 1 : null,
            installmentTotal: installmentCount > 1 ? installmentCount : null,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        createdExpenses.push(expense);
      }

      return createdExpenses;
    });

    return NextResponse.json(
      {
        count: expenses.length,
        expenses,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") {
      return NextResponse.json(
        { error: "Data de vencimento inválida" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível criar o gasto" },
      { status: 500 },
    );
  }
}
