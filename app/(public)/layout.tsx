export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary font-display text-primary-foreground">
          R
        </span>
        <span className="font-display text-xl tracking-tight text-ink">Razão</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
