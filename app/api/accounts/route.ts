import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const accountTypeSchema = z.enum(["CORRENTE", "POUPANCA", "RESERVA"]);

const createAccountSchema = z.object({
  bankId: z.string().min(1, "Selecione um banco"),

  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres")
    .max(80, "O nome deve possuir no máximo 80 caracteres"),

  type: accountTypeSchema,
});

export async function GET() {
  try {
    const user = await requireUser();

    const accounts = await prisma.bankAccount.findMany({
      where: {
        userId: user.id,
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
      orderBy: [
        {
          active: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createAccountSchema.safeParse(body);

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

    // Nunca confiar somente no bankId enviado pelo frontend.
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
      },
    });

    if (duplicatedAccount) {
      return NextResponse.json(
        { error: "Você já possui uma conta com esse nome nesse banco" },
        { status: 409 },
      );
    }

    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
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

    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar a conta" },
      { status: 500 },
    );
  }
}
