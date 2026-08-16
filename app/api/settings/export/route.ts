import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Tipo de exportação não informado" },
        { status: 400 },
      );
    }

    let data: any[] = [];
    let filename = "";

    switch (type) {
      case "expenses":
        data = await prisma.expense.findMany({
          where: {
            userId: user.id,
          },
          include: {
            category: {
              select: {
                name: true,
              },
            },
            paidAccount: {
              select: {
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
            dueDate: "desc",
          },
        });

        filename = "gastos.csv";
        break;

      case "receivables":
        data = await prisma.receivable.findMany({
          where: {
            userId: user.id,
          },
          include: {
            category: {
              select: {
                name: true,
              },
            },
            receivedAccount: {
              select: {
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
            expectedDate: "desc",
          },
        });

        filename = "recebimentos.csv";
        break;

      case "movements":
        data = await prisma.movement.findMany({
          where: {
            userId: user.id,
          },
          include: {
            account: {
              select: {
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

        filename = "movimentacoes.csv";
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de exportação inválido" },
          { status: 400 },
        );
    }

    const csv = convertToCSV(data, type);

    // Adicionar BOM para UTF-8
    const bom = "\uFEFF";
    const csvWithBOM = bom + csv;

    return new NextResponse(csvWithBOM, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível exportar os dados" },
      { status: 500 },
    );
  }
}

function convertToCSV(data: any[], type: string): string {
  if (data.length === 0) {
    return "";
  }

  let headers: string[] = [];
  let rows: string[][] = [];

  if (type === "expenses") {
    headers = [
      "Título",
      "Categoria",
      "Valor",
      "Vencimento",
      "Status",
      "Pago em",
      "Conta",
    ];

    rows = data.map((item) => [
      item.title,
      item.category.name,
      item.amount.toString().replace(".", ","),
      new Date(item.dueDate).toLocaleDateString("pt-BR"),
      item.status,
      item.paidAt ? new Date(item.paidAt).toLocaleDateString("pt-BR") : "",
      item.paidAccount
        ? `${item.paidAccount.bank.name} — ${item.paidAccount.name}`
        : "",
    ]);
  } else if (type === "receivables") {
    headers = [
      "Título",
      "Categoria",
      "Valor",
      "Previsto para",
      "Status",
      "Recebido em",
      "Conta",
    ];

    rows = data.map((item) => [
      item.title,
      item.category.name,
      item.amount.toString().replace(".", ","),
      new Date(item.expectedDate).toLocaleDateString("pt-BR"),
      item.status,
      item.receivedAt
        ? new Date(item.receivedAt).toLocaleDateString("pt-BR")
        : "",
      item.receivedAccount
        ? `${item.receivedAccount.bank.name} — ${item.receivedAccount.name}`
        : "",
    ]);
  } else if (type === "movements") {
    headers = ["Descrição", "Tipo", "Valor", "Data", "Origem", "Conta"];

    rows = data.map((item) => [
      item.description || "",
      item.type,
      item.amount.toString().replace(".", ","),
      new Date(item.date).toLocaleDateString("pt-BR"),
      item.origin,
      `${item.account.bank.name} — ${item.account.name}`,
    ]);
  }

  const csvRows = [
    headers.join(";"),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"),
    ),
  ];

  return csvRows.join("\n");
}
