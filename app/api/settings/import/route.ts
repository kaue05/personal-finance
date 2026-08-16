import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const importSchema = z.object({
  type: z.enum(["expenses", "receivables"]),
  data: z.array(z.record(z.string())),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { type, data } = parsed.data;

    if (data.length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado para importar" },
        { status: 400 },
      );
    }

    // Validar colunas obrigatórias
    const requiredColumns =
      type === "expenses"
        ? ["Título", "Categoria", "Valor", "Vencimento"]
        : ["Título", "Categoria", "Valor", "Previsto para"];

    const firstRow = data[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Colunas faltando: ${missingColumns.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Buscar categorias do usuário
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        type: type === "expenses" ? "EXPENSE" : "RECEIVABLE",
      },
    });

    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    let imported = 0;
    let errors: string[] = [];

    for (const row of data) {
      try {
        const title = row["Título"]?.trim();
        const categoryName = row["Categoria"]?.trim();
        const valueStr = row["Valor"]
          ?.replace("R$", "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim();
        const dateStr =
          type === "expenses" ? row["Vencimento"] : row["Previsto para"];

        if (!title || !categoryName || !valueStr || !dateStr) {
          errors.push(`Linha inválida: ${title || "sem título"}`);
          continue;
        }

        const value = Number(valueStr);
        if (Number.isNaN(value) || value <= 0) {
          errors.push(`Valor inválido em "${title}"`);
          continue;
        }

        const categoryId = categoryMap.get(categoryName.toLowerCase());

        if (!categoryId) {
          errors.push(
            `Categoria não encontrada: "${categoryName}" em "${title}"`,
          );
          continue;
        }

        const date = parseDate(dateStr);
        if (!date) {
          errors.push(`Data inválida em "${title}"`);
          continue;
        }

        if (type === "expenses") {
          await prisma.expense.create({
            data: {
              userId: user.id,
              categoryId,
              title,
              amount: value,
              dueDate: date,
              status: "PENDENTE",
            },
          });
        } else {
          await prisma.receivable.create({
            data: {
              userId: user.id,
              categoryId,
              title,
              amount: value,
              expectedDate: date,
              status: "PENDENTE",
            },
          });
        }

        imported++;
      } catch (err) {
        errors.push(`Erro ao importar: ${row["Título"] || "desconhecido"}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
    });
  } catch (err) {
    console.error("Erro na importação:", err);
    return NextResponse.json(
      { error: "Não foi possível importar os dados" },
      { status: 500 },
    );
  }
}

function parseDate(dateStr: string): Date | null {
  // Tenta parsear DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // Tenta parsear como ISO
  const isoDate = new Date(dateStr);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  return null;
}
