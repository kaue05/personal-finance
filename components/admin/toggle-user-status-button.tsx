// components/admin/toggle-user-status-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ToggleUserStatusButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    setIsToggling(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível alterar o status");
      }

      window.location.reload();
    } catch {
      setIsToggling(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isToggling}
    >
      {isToggling
        ? "Alterando..."
        : isActive
        ? "Desativar"
        : "Ativar"}
    </Button>
  );
}