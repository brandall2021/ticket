import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

const roleBadgeVariant = {
  ADMIN: "destructive" as const,
  AGENT: "warning" as const,
  CLIENT: "secondary" as const,
} as const;

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-neutral-900"
          >
            Helpdesk
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/tickets"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Tickets
            </Link>
            {session?.user?.role && ["ADMIN", "AGENT"].includes(session.user.role) && (
              <Link
                href="/admin"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-neutral-600 sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              {session.user.role && (
                <Badge variant={roleBadgeVariant[session.user.role as keyof typeof roleBadgeVariant] ?? "secondary"}>
                  {session.user.role}
                </Badge>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
