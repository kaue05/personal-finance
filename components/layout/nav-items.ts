import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  Landmark,
  Wallet,
  Building2,
  HandCoins,
  BarChart3,
  Tag,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Ordem reflete a frequência de uso esperada (mobile-first: os primeiros
// aparecem na barra inferior em telas pequenas).
export const PRIVATE_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/recebimentos", label: "Recebimentos", icon: Landmark },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/bancos", label: "Bancos", icon: Building2 },
  { href: "/dividas", label: "Dívidas", icon: HandCoins },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/categorias", label: "Categorias", icon: Tag },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
