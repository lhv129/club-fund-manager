import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Club Fund Manager</h1>
      </div>
      {children}
    </div>
  );
}
