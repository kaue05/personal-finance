import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const updatePreferencesSchema = z.object({
  currency: z.enum(["BRL", "USD", "EUR"]).optional(),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY"]).optional(),
  firstDayOfWeek: z.enum(["sunday", "monday"]).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  fiscalYearStart: z.number().min(0).max(11).optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        ...parsed.data,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        currency: updatedUser.currency,
        dateFormat: updatedUser.dateFormat,
        firstDayOfWeek: updatedUser.firstDayOfWeek,
        theme: updatedUser.theme,
        fiscalYearStart: updatedUser.fiscalYearStart,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar as preferências" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    // Buscar o usuário completo no Prisma para pegar as preferências
    const fullUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      currency: fullUser.currency,
      dateFormat: fullUser.dateFormat,
      firstDayOfWeek: fullUser.firstDayOfWeek,
      theme: fullUser.theme,
      fiscalYearStart: fullUser.fiscalYearStart,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível buscar as preferências" },
      { status: 500 },
    );
  }
}