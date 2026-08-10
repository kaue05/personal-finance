import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const accountTypeSchema = z.enum(["CORRENTE", "POUPANCA", "RESERVA"]);

const updateAccountSchema = z.object({
  bankId: z.string().min(1, "Selecione um banco"),

  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres")
    .max(80, "O nome deve possuir no máximo 80 caracteres"),

  type: accountTypeSchema,
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

    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { bankId, name, type } = parsed.data;

    const existingAccount = await prisma.bankAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 },
      );
    }

    const bank = await prisma.bank.findFirst({
      where: {
        id: bankId,
        userId: user.id,
        active: true,
      },
    });

    if (!bank) {
      return NextResponse.json(
        { error: "Banco inválido ou inativo" },
        { status: 400 },
      );
    }

    const duplicatedAccount = await prisma.bankAccount.findFirst({
      where: {
        userId: user.id,
        bankId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (duplicatedAccount) {
      return NextResponse.json(
        { error: "Já existe outra conta com esse nome nesse banco" },
        { status: 409 },
      );
    }

    const account = await prisma.bankAccount.update({
      where: {
        id,
      },
      data: {
        bankId,
        name,
        type,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            movementsAsSource: true,
          },
        },
      },
    });

    return NextResponse.json(account);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar a conta" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const account = await prisma.bankAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 },
      );
    }

    // Desativação lógica. A conta não é excluída,
    // pois poderá possuir histórico financeiro.
    await prisma.bankAccount.update({
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
      { error: "Não foi possível desativar a conta" },
      { status: 500 },
    );
  }
}
