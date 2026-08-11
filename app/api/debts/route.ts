import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const createDebtSchema = z.object({
  title: z.string().trim().min(2, "Informe o título da dívida").max(150),

  totalAmount: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, "Informe um valor válido")
    .refine((value) => Number(value.replace(",", ".")) > 0, {
      message: "O valor deve ser maior que zero",
    }),
});

export async function GET() {
  try {
    const user = await requireUser();

    const debts = await prisma.debt.findMany({
      where: {
        userId: user.id,
      },
      include: {
        payments: {
          include: {
            account: {
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
          },
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(debts);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createDebtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        totalAmount: parsed.data.totalAmount.replace(",", "."),
        status: "ABERTA",
      },
    });

    return NextResponse.json(debt, {
      status: 201,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar a dívida" },
      { status: 500 },
    );
  }
}
