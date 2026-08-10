import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const categoryTypeSchema = z.enum([
  "EXPENSE",
  "RECEIVABLE",
]);

const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres")
    .max(60, "O nome deve possuir no máximo 60 caracteres"),

  type: categoryTypeSchema,

  active: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateCategorySchema.safeParse(body);

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
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            expenses: true,
            receivables: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    const hasHistoricalUsage =
      category._count.expenses > 0 ||
      category._count.receivables > 0;

    if (hasHistoricalUsage && parsed.data.type !== category.type) {
      return NextResponse.json(
        {
          error:
            "Não é possível alterar o tipo de uma categoria já utilizada em históricos",
        },
        { status: 409 },
      );
    }

    const duplicatedCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        type: parsed.data.type,
        name: {
          equals: parsed.data.name,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (duplicatedCategory) {
      return NextResponse.json(
        {
          error:
            "Você já possui outra categoria com esse nome e tipo",
        },
        { status: 409 },
      );
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        ...(parsed.data.active !== undefined && {
          active: parsed.data.active,
        }),
      },
      include: {
        _count: {
          select: {
            expenses: true,
            receivables: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar a categoria" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    await prisma.category.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível desativar a categoria" },
      { status: 500 },
    );
  }
}