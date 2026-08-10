import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const updateReceivableSchema = z.object({
  categoryId: z.string().min(1),

    title: z
        .string()
        .trim()
        .min(2)
        .max(150),

    amount: z
        .string()
        .regex(/^\d+([.,]\d{1,2})?$/)
        .refine((value) => Number(value.replace(",", ".")) > 0),

    expectedDate: z
        .string()
        .min(1),

    referenceMonth: z
        .string()
        .regex(/^\d{4}-\d{2}$/),
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

function parseReferenceMonth(value: string) {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    throw new Error("INVALID_REFERENCE_MONTH");
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateReceivableSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const receivable = await prisma.receivable.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!receivable) {
      return NextResponse.json(
        { error: "Recebimento não encontrado" },
        { status: 404 },
      );
    }

    if (receivable.status !== "PENDENTE") {
      return NextResponse.json(
        {
          error: "Somente recebimentos pendentes podem ser editados",
        },
        { status: 409 },
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

    const updatedReceivable = await prisma.receivable.update({
      where: {
        id,
      },
      data: {
        categoryId: parsed.data.categoryId,
        title: parsed.data.title,
        amount: parsed.data.amount.replace(",", "."),
        expectedDate: parseDate(parsed.data.expectedDate),
        referenceMonth: parseReferenceMonth(parsed.data.referenceMonth),
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

    return NextResponse.json(updatedReceivable);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") {
      return NextResponse.json(
        { error: "Data prevista inválida" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível atualizar o recebimento" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const receivable = await prisma.receivable.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!receivable) {
      return NextResponse.json(
        { error: "Recebimento não encontrado" },
        { status: 404 },
      );
    }

    if (receivable.status !== "PENDENTE") {
      return NextResponse.json(
        {
          error: "Somente recebimentos pendentes podem ser cancelados",
        },
        { status: 409 },
      );
    }

    await prisma.receivable.update({
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
      { error: "Não foi possível cancelar o recebimento" },
      { status: 500 },
    );
  }
}
