import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const createBankSchema = z.object({
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
    .optional()
    .or(z.literal("")),
});

export async function GET() {
  try {
    const user = await requireUser();

    const banks = await prisma.bank.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            bankAccounts: true,
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

    return NextResponse.json(banks);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createBankSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const name = parsed.data.name;
    const logoUrl = parsed.data.logoUrl || null;

    const duplicatedBank = await prisma.bank.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (duplicatedBank) {
      return NextResponse.json(
        { error: "Você já possui um banco com esse nome" },
        { status: 409 },
      );
    }

    const bank = await prisma.bank.create({
      data: {
        userId: user.id,
        name,
        logoUrl,
      },
      include: {
        _count: {
          select: {
            bankAccounts: true,
          },
        },
      },
    });

    return NextResponse.json(bank, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar o banco" },
      { status: 500 },
    );
  }
}
