import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Vestuário",
  "Serviços",
  "Outros",
];

const DEFAULT_RECEIVABLE_CATEGORIES = [
  "Salário",
  "Investimentos",
  "Vendas",
  "Serviços",
  "Empréstimos",
  "Outros",
];

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    // Deletar categorias existentes
    await Promise.all([
      prisma.category.deleteMany({
        where: {
          userId: user.id,
          type: "EXPENSE",
        },
      }),
      prisma.category.deleteMany({
        where: {
          userId: user.id,
          type: "RECEIVABLE",
        },
      }),
    ]);

    // Criar novas categorias
    const [expenseCategories, receivableCategories] = await Promise.all([
      prisma.category.createMany({
        data: DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
          userId: user.id,
          name,
          type: "EXPENSE",
        })),
      }),

      prisma.category.createMany({
        data: DEFAULT_RECEIVABLE_CATEGORIES.map((name) => ({
          userId: user.id,
          name,
          type: "RECEIVABLE",
        })),
      }),
    ]);

    return NextResponse.json({
      success: true,
      expenseCategories: expenseCategories.count,
      receivableCategories: receivableCategories.count,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível restaurar as categorias" },
      { status: 500 },
    );
  }
}
