import { LogOutIcon, RefreshCwIcon } from "lucide-react";
import { Link, Outlet } from "react-router";
import { PersonAvatar } from "@/components/person";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/queries";

export function AppShell() {
  const me = useMe();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <RefreshCwIcon className="size-4" aria-hidden />
            </span>
            LoopTalk
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {me.data && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <PersonAvatar name={me.data.name} userId={me.data.id} />
                {me.data.name}
              </span>
            )}
            <Button variant="ghost" size="sm" asChild>
              <a href="/auth/logout">
                <LogOutIcon aria-hidden />
                Abmelden
              </a>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
