import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const createReceivableSchema = z.object({
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

  expectedDate: z.string().min(1),

  // Formato: YYYY-MM
  referenceMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Informe o mês de referência"),
});

function parseDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATE");
  }

  return date;
}

function parseReferenceMonth(value: string) {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    throw new Error("INVALID_REFERENCE_MONTH");
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");

    const validStatuses = ["PENDENTE", "RECEBIDO", "CANCELADO"] as const;

    const statusFilter = validStatuses.includes(
      status as (typeof validStatuses)[number],
    )
      ? (status as (typeof validStatuses)[number])
      : undefined;

    const receivables = await prisma.receivable.findMany({
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
        movement: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: {
        expectedDate: "desc",
      },
    });

    return NextResponse.json(receivables);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createReceivableSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        userId: user.id,
        type: "RECEIVABLE",
        active: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          error: "Categoria de recebimento inválida ou inativa",
        },
        { status: 400 },
      );
    }

    const receivable = await prisma.receivable.create({
      data: {
        userId: user.id,
        categoryId: parsed.data.categoryId,
        title: parsed.data.title,
        amount: parsed.data.amount.replace(",", "."),
        expectedDate: parseDate(parsed.data.expectedDate),
        referenceMonth: parseReferenceMonth(parsed.data.referenceMonth),
        status: "PENDENTE",
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

    return NextResponse.json(receivable, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") {
      return NextResponse.json(
        { error: "Data prevista inválida" },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "INVALID_REFERENCE_MONTH") {
      return NextResponse.json(
        { error: "Mês de referência inválido" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível criar o recebimento" },
      { status: 500 },
    );
  }
}
