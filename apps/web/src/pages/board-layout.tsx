import type { BoardView } from "@looptalk/shared";
import { HistoryIcon, LayoutGridIcon, LinkIcon, ScrollTextIcon, UsersIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useMatch, useOutletContext, useParams } from "react-router";
import { toast } from "sonner";
import { useChromeSlot } from "@/components/chrome-context";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { PageContainer } from "@/components/page-container";
import { PresenceBar } from "@/components/presence-bar";
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
  { to: "", label: "Board", end: true, icon: LayoutGridIcon },
  { to: "history", label: "Historie", icon: HistoryIcon },
  { to: "audit", label: "Audit-Log", icon: ScrollTextIcon },
  { to: "participants", label: "Teilnehmer", icon: UsersIcon },
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
  const slot = useChromeSlot();
  // Nur das Board selbst ist die randlose Wand; Historie, Audit-Log und Teilnehmer bleiben im Container.
  const onBoard = useMatch({ path: "/b/:slug", end: true }) !== null;

  if (board.error instanceof ApiError && board.error.status === 404) {
    return (
      <PageContainer>
        <NotFoundPage message="Dieses Board gibt es nicht. Prüfe den Link." />
      </PageContainer>
    );
  }
  if (!board.data) {
    return (
      <PageContainer>
        <div className="grid gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  // Inhalt der Glasleiste: Name, Bereiche als Segment-Pille, Link und Anwesenheit.
  const chrome = (
    <>
      <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden>
        /
      </span>
      <div className="flex min-w-0 items-center gap-0.5">
        <h1 className="truncate text-base font-semibold tracking-tight">{board.data.name}</h1>
        <EditBoardDialog slug={slug} name={board.data.name} wall={board.data.wall} />
      </div>
      <nav className="flex shrink-0 rounded-full bg-foreground/6 p-0.5" aria-label="Board-Ansichten">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium transition-colors md:px-3",
                isActive ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <tab.icon className="size-4" aria-hidden />
            <span className="hidden md:inline">{tab.label}</span>
            <span className="sr-only md:hidden">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
      {/* Auf dem Handy bleiben Name, Bereiche und Avatar; Link und Anwesenheit kommen ab sm dazu. */}
      <Button
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => void copyLink()}
        aria-label="Link kopieren"
      >
        <LinkIcon aria-hidden />
        <span className="hidden lg:inline">Link kopieren</span>
      </Button>
      <div className="ml-auto hidden sm:block">
        <PresenceBar users={present} connected={connected} />
      </div>
    </>
  );

  const outlet = <Outlet key={slug} context={{ slug, board: board.data } satisfies BoardContext} />;

  return (
    <>
      {slot && createPortal(chrome, slot)}
      {/* Pro Board neu einhängen, damit Zustand (z. B. Terminnummer fürs Weiterrücken) nicht zwischen Boards wandert */}
      {onBoard ? outlet : <PageContainer>{outlet}</PageContainer>}
    </>
  );
}
