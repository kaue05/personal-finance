import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { CategoryManager } from "@/components/categories/category-manager";

export default async function CategoriesPage() {
  const user = await requireUser();

  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
    },
    include: {
      _count: {
        select: {
          expenses: true,
          receivables: true,
        },
      },
    },
    orderBy: [
      {
        active: "desc",
      },
      {
        type: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  const serializedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    active: category.active,
    expenseCount: category._count.expenses,
    receivableCount: category._count.receivables,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">
          Organização financeira
        </p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Categorias
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Organize seus gastos e recebimentos. Categorias utilizadas no
          histórico não serão excluídas fisicamente.
        </p>
      </header>

      <CategoryManager
        initialCategories={serializedCategories}
      />
    </div>
  );
}