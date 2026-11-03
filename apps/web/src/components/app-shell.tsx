import { LogOutIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router";
import { ChromeSlotProvider } from "@/components/chrome-context";
import { PersonAvatar } from "@/components/person";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/queries";

/** Rahmen der App: eine Glasleiste oben mit Slot für das Board, darunter die Seite. */
export function AppShell() {
  const me = useMe();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return (
    <ChromeSlotProvider value={slot}>
      <div className="min-h-screen">
        <header
          data-testid="glass-bar"
          className="glass sticky top-0 z-40 flex h-(--bar-h) items-center gap-3 rounded-none border-x-0 border-t-0 px-4"
        >
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <RefreshCwIcon className="size-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">LoopTalk</span>
            <span className="sr-only sm:hidden">LoopTalk</span>
          </Link>
          {/* Slot: Das Board-Layout hängt hier Name, Bereiche, Link und Anwesenheit ein. */}
          <div ref={setSlot} className="flex min-w-0 flex-1 items-center gap-3" />
          <div className="flex shrink-0 items-center gap-2">
            {me.data && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <PersonAvatar name={me.data.name} userId={me.data.id} />
                <span className="hidden md:inline">{me.data.name}</span>
              </span>
            )}
            <Button variant="ghost" size="sm" asChild>
              <a href="/auth/logout" aria-label="Abmelden">
                <LogOutIcon aria-hidden />
                <span className="hidden md:inline">Abmelden</span>
              </a>
            </Button>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </ChromeSlotProvider>
  );
}
