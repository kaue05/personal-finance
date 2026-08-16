import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "A senha deve possuir pelo menos 6 caracteres"),

    newPassword: z
      .string()
      .min(6, "A nova senha deve possuir pelo menos 6 caracteres"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = updatePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Better Auth changePassword usa a sessão, não precisa de userId
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        newPassword: parsed.data.newPassword,
        currentPassword: parsed.data.currentPassword,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);

    return NextResponse.json(
      { error: "Não foi possível alterar a senha" },
      { status: 500 },
    );
  }
}
