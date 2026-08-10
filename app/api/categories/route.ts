import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const categoryTypeSchema = z.enum(["EXPENSE", "RECEIVABLE"]);

const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres")
    .max(60, "O nome deve possuir no máximo 60 caracteres"),

  type: categoryTypeSchema,
});

export async function GET() {
  try {
    const user = await requireUser();

    const categories = await prisma.category.findMany({
      where: {
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
      orderBy: [
        {
          active: "desc",
        },
        {
          type: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, type } = parsed.data;

    const duplicatedCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        type,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (duplicatedCategory) {
      return NextResponse.json(
        {
          error: "Você já possui uma categoria com esse nome e tipo",
        },
        { status: 409 },
      );
    }

    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name,
        type,
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

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar a categoria" },
      { status: 500 },
    );
  }
}
