// app/api/admin/users/[id]/toggle/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const toggleSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id },
      data: { active: parsed.data.active },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível alterar o status" },
      { status: 500 },
    );
  }
}
