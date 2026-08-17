import Image from "next/image";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Personal Finance Logo"
          width={36}
          height={36}
          className="rounded-sm"
          priority
        />
        <span className="font-display text-xl tracking-tight text-ink">
          Personal Finance
        </span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}