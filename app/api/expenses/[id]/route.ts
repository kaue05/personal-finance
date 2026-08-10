import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const updateExpenseSchema = z.object({
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
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseAmount(value: string) {
  return value.replace(",", ".");
}

function parseDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Gasto não encontrado" },
        { status: 404 },
      );
    }

    if (expense.status !== "PENDENTE") {
      return NextResponse.json(
        {
          error: "Somente gastos pendentes podem ser editados",
        },
        { status: 409 },
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        userId: user.id,
        type: "EXPENSE",
        active: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria de gasto inválida ou inativa" },
        { status: 400 },
      );
    }

    const updatedExpense = await prisma.expense.update({
      where: {
        id,
      },
      data: {
        categoryId: parsed.data.categoryId,
        title: parsed.data.title,
        amount: parseAmount(parsed.data.amount),
        dueDate: parseDate(parsed.data.dueDate),
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

    return NextResponse.json(updatedExpense);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar o gasto" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Gasto não encontrado" },
        { status: 404 },
      );
    }

    if (expense.status !== "PENDENTE") {
      return NextResponse.json(
        {
          error: "Somente gastos pendentes podem ser cancelados",
        },
        { status: 409 },
      );
    }

    await prisma.expense.update({
      where: {
        id,
      },
      data: {
        status: "CANCELADO",
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível cancelar o gasto" },
      { status: 500 },
    );
  }
}
