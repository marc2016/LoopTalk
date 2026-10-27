import type { BoardView } from "@looptalk/shared";
import { LinkIcon } from "lucide-react";
import { NavLink, Outlet, useOutletContext, useParams } from "react-router";
import { toast } from "sonner";
import { PresenceBar } from "@/components/presence-bar";
import { RenameBoardDialog } from "@/components/rename-board-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useBoardEvents } from "@/lib/events";
import { useBoard } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { NotFoundPage } from "./not-found-page";

export interface BoardContext {
  slug: string;
  board: BoardView;
}

export const useBoardContext = () => useOutletContext<BoardContext>();

const tabs = [
  { to: "", label: "Board", end: true },
  { to: "history", label: "Historie" },
  { to: "audit", label: "Audit-Log" },
  { to: "participants", label: "Teilnehmer" },
];

async function copyLink() {
  const url = `${window.location.origin}${window.location.pathname.replace(/\/(history|audit|participants)$/, "")}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link kopiert. Wer ihn öffnet, kann mitmachen.");
  } catch {
    toast.info(url);
  }
}

export function BoardLayout() {
  const { slug = "" } = useParams();
  const board = useBoard(slug);
  const { present, connected } = useBoardEvents(slug);

  if (board.error instanceof ApiError && board.error.status === 404) {
    return <NotFoundPage message="Dieses Board gibt es nicht. Prüfe den Link." />;
  }
  if (!board.data) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold">{board.data.name}</h1>
          <RenameBoardDialog slug={slug} name={board.data.name} />
        </div>
        <Button variant="outline" size="sm" onClick={() => void copyLink()}>
          <LinkIcon aria-hidden />
          Link kopieren
        </Button>
        <div className="ml-auto">
          <PresenceBar users={present} connected={connected} />
        </div>
      </div>

      <nav className="flex gap-1 border-b" aria-label="Board-Ansichten">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ slug, board: board.data } satisfies BoardContext} />
    </div>
  );
}
