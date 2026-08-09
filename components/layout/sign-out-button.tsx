"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sair">
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sair</span>
    </Button>
  );
}
