import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const roleBadgeVariant: Record<string, "destructive" | "warning" | "secondary" | "default"> = {
  ADMIN: "destructive",
  AGENT: "warning",
  EDITOR: "secondary",
  CLIENT: "secondary",
};

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white transition-colors dark:border-navy-700 dark:bg-navy-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="Helpdesk"
              width={180}
              height={50}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/tickets"
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-neutral-300 dark:hover:bg-navy-700 dark:hover:text-brand-400"
            >
              Tickets
            </Link>
            {session?.user?.role && ["ADMIN", "AGENT", "EDITOR"].includes(session.user.role) && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-neutral-300 dark:hover:bg-navy-700 dark:hover:text-brand-400"
              >
                Admin
              </Link>
            )}
            {session?.user?.role && ["ADMIN", "AGENT"].includes(session.user.role) && (
              <Link
                href="/admin/stock"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-neutral-300 dark:hover:bg-navy-700 dark:hover:text-brand-400"
              >
                Stock
              </Link>
            )}
            {session?.user && (
              <Link
                href="/links"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-neutral-300 dark:hover:bg-navy-700 dark:hover:text-brand-400"
              >
                Links
              </Link>
            )}
            {session?.user && (
              <Link
                href="/internos"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-neutral-300 dark:hover:bg-navy-700 dark:hover:text-brand-400"
              >
                Internos
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {session?.user ? (
            <>
              <Link href="/perfil" className="hidden text-sm text-neutral-600 transition-colors hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-400 sm:inline">
                {session.user.name ?? session.user.email}
              </Link>
              {session.user.role && (
                <Badge variant={roleBadgeVariant[session.user.role] ?? "secondary"}>
                  {session.user.role}
                </Badge>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm font-medium text-neutral-500 underline-offset-2 transition-colors hover:text-brand-600 hover:underline dark:text-neutral-400 dark:hover:text-brand-400"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
