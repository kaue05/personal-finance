import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const ZERO = new Prisma.Decimal(0);

type PeriodOption = "1month" | "6months" | "1year" | "5years" | "10years";

function getPeriodRange(period: PeriodOption, reference: Date) {
  const end = new Date(
    Date.UTC(reference.getFullYear(), reference.getMonth() + 1, 1),
  );

  let start: Date;

  switch (period) {
    case "1month":
      start = new Date(
        Date.UTC(reference.getFullYear(), reference.getMonth(), 1),
      );
      break;

    case "6months":
      start = new Date(
        Date.UTC(reference.getFullYear(), reference.getMonth() - 5, 1),
      );
      break;

    case "1year":
      start = new Date(
        Date.UTC(reference.getFullYear() - 1, reference.getMonth() + 1, 1),
      );
      break;

    case "5years":
      start = new Date(
        Date.UTC(reference.getFullYear() - 5, reference.getMonth() + 1, 1),
      );
      break;

    case "10years":
      start = new Date(
        Date.UTC(reference.getFullYear() - 10, reference.getMonth() + 1, 1),
      );
      break;

    default:
      start = new Date(
        Date.UTC(reference.getFullYear(), reference.getMonth(), 1),
      );
  }

  return { start, end };
}

function getMonthsForPeriod(period: PeriodOption, reference: Date) {
  const result: { label: string; start: Date; end: Date }[] = [];

  let monthsCount: number;

  switch (period) {
    case "1month":
      monthsCount = 1;
      break;
    case "6months":
      monthsCount = 6;
      break;
    case "1year":
      monthsCount = 12;
      break;
    case "5years":
      monthsCount = 60;
      break;
    case "10years":
      monthsCount = 120;
      break;
    default:
      monthsCount = 12;
  }

  for (let i = monthsCount - 1; i >= 0; i--) {
    const base = new Date(reference.getFullYear(), reference.getMonth() - i, 1);

    const year = base.getFullYear();
    const month = base.getMonth();

    let label: string;

    if (period === "1month") {
      label = base.toLocaleString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    } else if (monthsCount <= 12) {
      label = base.toLocaleString("pt-BR", {
        month: "short",
        year: monthsCount > 6 ? "numeric" : undefined,
      });
    } else {
      label = base.toLocaleString("pt-BR", {
        month: "short",
        year: "numeric",
      });
    }

    result.push({
      label: label.replace(".", ""),
      start: new Date(Date.UTC(year, month, 1)),
      end: new Date(Date.UTC(year, month + 1, 1)),
    });
  }

  return result;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const referenceParam = searchParams.get("reference");
    const periodParam = searchParams.get("period");

    const reference = referenceParam
      ? new Date(`${referenceParam}-01T12:00:00.000Z`)
      : new Date();

    if (Number.isNaN(reference.getTime())) {
      return NextResponse.json(
        { error: "Data de referência inválida" },
        { status: 400 },
      );
    }

    const validPeriods = [
      "1month",
      "6months",
      "1year",
      "5years",
      "10years",
    ] as const;

    const selectedPeriod: PeriodOption = validPeriods.includes(
      periodParam as (typeof validPeriods)[number],
    )
      ? (periodParam as (typeof validPeriods)[number])
      : "1month";

    const { start, end } = getPeriodRange(selectedPeriod, reference);

    const months = getMonthsForPeriod(selectedPeriod, reference);

    const [
      expensesByCategory,
      receivablesByCategory,
      expensesByMonth,
      receivablesByMonth,
      patrimonyByMonth,
    ] = await Promise.all([
      // Gastos por categoria no período
      prisma.expense.findMany({
        where: {
          userId: user.id,
          status: "PAGO",
          paidAt: {
            gte: start,
            lt: end,
          },
        },
        select: {
          categoryId: true,
          amount: true,
        },
      }),

      // Receitas por categoria no período
      prisma.receivable.findMany({
        where: {
          userId: user.id,
          status: "RECEBIDO",
          receivedAt: {
            gte: start,
            lt: end,
          },
        },
        select: {
          categoryId: true,
          amount: true,
        },
      }),

      // Gastos por mês no período
      Promise.all(
        months.map(async (month) => {
          const result = await prisma.movement.aggregate({
            where: {
              userId: user.id,
              type: "SAIDA",
              origin: "GASTO",
              date: {
                gte: month.start,
                lt: month.end,
              },
            },
            _sum: {
              amount: true,
            },
          });

          return {
            label: month.label,
            value: result._sum.amount ?? ZERO,
          };
        }),
      ),

      // Receitas por mês no período
      Promise.all(
        months.map(async (month) => {
          const result = await prisma.movement.aggregate({
            where: {
              userId: user.id,
              type: "ENTRADA",
              origin: "RECEBIMENTO",
              date: {
                gte: month.start,
                lt: month.end,
              },
            },
            _sum: {
              amount: true,
            },
          });

          return {
            label: month.label,
            value: result._sum.amount ?? ZERO,
          };
        }),
      ),

      // Patrimônio por mês no período
      Promise.all(
        months.map(async (month) => {
          const entradas = await prisma.movement.aggregate({
            where: {
              userId: user.id,
              type: "ENTRADA",
              date: {
                lt: month.end,
              },
            },
            _sum: {
              amount: true,
            },
          });

          const saidas = await prisma.movement.aggregate({
            where: {
              userId: user.id,
              type: "SAIDA",
              date: {
                lt: month.end,
              },
            },
            _sum: {
              amount: true,
            },
          });

          const balance = (entradas._sum.amount ?? ZERO).minus(
            saidas._sum.amount ?? ZERO,
          );

          return {
            label: month.label,
            value: balance,
          };
        }),
      ),
    ]);

    // Buscar categorias de gastos
    const categoryMap = new Map<string, { id: string; name: string }>();

    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
      },
      select: {
        id: true,
        name: true,
      },
    });

    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
      });
    });

    // Agrupar gastos por categoria
    const expensesByCategoryMap = new Map<string, Prisma.Decimal>();

    expensesByCategory.forEach((expense) => {
      const current = expensesByCategoryMap.get(expense.categoryId) ?? ZERO;

      expensesByCategoryMap.set(
        expense.categoryId,
        current.plus(expense.amount),
      );
    });

    const expensesByCategoryChart = Array.from(expensesByCategoryMap.entries())
      .map(([categoryId, amount]) => {
        const category = categoryMap.get(categoryId);

        return {
          name: category?.name ?? "Outros",
          value: Number(amount),
        };
      })
      .sort((a, b) => b.value - a.value);

    // Buscar categorias de receitas
    const receivableCategoryMap = new Map<
      string,
      { id: string; name: string }
    >();

    const receivableCategories = await prisma.category.findMany({
      where: {
        userId: user.id,
        type: "RECEIVABLE",
      },
      select: {
        id: true,
        name: true,
      },
    });

    receivableCategories.forEach((cat) => {
      receivableCategoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
      });
    });

    // Agrupar receitas por categoria
    const receivablesByCategoryMap = new Map<string, Prisma.Decimal>();

    receivablesByCategory.forEach((receivable) => {
      const current =
        receivablesByCategoryMap.get(receivable.categoryId) ?? ZERO;

      receivablesByCategoryMap.set(
        receivable.categoryId,
        current.plus(receivable.amount),
      );
    });

    const receivablesByCategoryChart = Array.from(
      receivablesByCategoryMap.entries(),
    )
      .map(([categoryId, amount]) => {
        const category = receivableCategoryMap.get(categoryId);

        return {
          name: category?.name ?? "Outros",
          value: Number(amount),
        };
      })
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      expensesByCategory: expensesByCategoryChart,
      receivablesByCategory: receivablesByCategoryChart,
      expensesByMonth: expensesByMonth.map((item) => ({
        label: item.label,
        value: Number(item.value),
      })),
      receivablesByMonth: receivablesByMonth.map((item) => ({
        label: item.label,
        value: Number(item.value),
      })),
      patrimonyByMonth: patrimonyByMonth.map((item) => ({
        label: item.label,
        value: Number(item.value),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
}
