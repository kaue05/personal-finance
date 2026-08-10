import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const updateBankSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres")
    .max(80, "O nome deve possuir no máximo 80 caracteres"),

  logoUrl: z
    .string()
    .trim()
    .url("Informe uma URL válida")
    .max(500)
    .nullable()
    .optional()
    .or(z.literal("")),
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

    const parsed = updateBankSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const existingBank = await prisma.bank.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingBank) {
      return NextResponse.json(
        { error: "Banco não encontrado" },
        { status: 404 },
      );
    }

    const duplicatedBank = await prisma.bank.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: parsed.data.name,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (duplicatedBank) {
      return NextResponse.json(
        { error: "Você já possui outro banco com esse nome" },
        { status: 409 },
      );
    }

    const bank = await prisma.bank.update({
      where: {
        id,
      },
      data: {
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl || null,
      },
      include: {
        _count: {
          select: {
            bankAccounts: true,
          },
        },
      },
    });

    return NextResponse.json(bank);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar o banco" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const bank = await prisma.bank.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            bankAccounts: true,
          },
        },
      },
    });

    if (!bank) {
      return NextResponse.json(
        { error: "Banco não encontrado" },
        { status: 404 },
      );
    }

    if (bank._count.bankAccounts > 0) {
      return NextResponse.json(
        {
          error:
            "Este banco possui contas vinculadas. Ele será apenas desativado.",
        },
        { status: 409 },
      );
    }

    await prisma.bank.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível desativar o banco" },
      { status: 500 },
    );
  }
}
