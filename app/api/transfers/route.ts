import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { createTransfer } from "@/lib/finance/transfer";
import { prisma } from "@/lib/prisma";

const createTransferSchema = z.object({
  fromAccountId: z.string().min(1, "Selecione a conta de origem"),
  toAccountId: z.string().min(1, "Selecione a conta de destino"),
  amount: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, "Informe um valor válido"),
  date: z.string().min(1, "Informe a data"),
  description: z.string().optional(),
});

function parseDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATE");
  }
  return date;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const transfers = await prisma.transfer.findMany({
      where: {
        userId: user.id,
      },
      include: {
        fromAccount: {
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
        toAccount: {
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
    });

    return NextResponse.json(transfers);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createTransferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fromAccountId, toAccountId, amount, date, description } =
      parsed.data;

    const transferDate = parseDate(date);
    const transferAmount = Number(amount.replace(",", "."));

    const transfer = await createTransfer({
  userId: user.id,
  fromAccountId,
  toAccountId,
  amount: transferAmount,
  date: transferDate,
  description: description || undefined,
});

// Buscar transferência completa com contas
const fullTransfer = await prisma.transfer.findUnique({
  where: { id: transfer.id },
  include: {
    fromAccount: {
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
    toAccount: {
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
});

return NextResponse.json(fullTransfer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") {
      return NextResponse.json(
        { error: "Data inválida" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar transferência" },
      { status: 500 },
    );
  }
}