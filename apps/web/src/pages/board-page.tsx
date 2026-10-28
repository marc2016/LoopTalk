import type { Column } from "@looptalk/shared";
import { ArchiveIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CardDialog } from "@/components/card-dialog";
import { type EndControls, MeetingBar } from "@/components/meeting-bar";
import { type EndPreview, TopicCard } from "@/components/topic-card";
import { Button } from "@/components/ui/button";
import { columns, lifecycle } from "@/lib/lifecycle";
import { useCardShift } from "@/lib/use-card-shift";
import { cn } from "@/lib/utils";
import { useBoardContext } from "./board-layout";

export function BoardPage() {
  const { slug, board } = useBoardContext();
  const { meeting } = board;
  const [dialog, setDialog] = useState<{ open: boolean; cardId: number | null }>({ open: false, cardId: null });
  // Die Karte immer aus dem aktuellen Stand lesen, damit Änderungen anderer sofort sichtbar sind.
  const openCard = dialog.cardId === null ? null : (board.cards.find((c) => c.id === dialog.cardId) ?? null);
  const dialogOpen = dialog.open && (dialog.cardId === null || openCard !== null);

  // Bestätigung gilt nur für die Terminversion, bei der sie geöffnet wurde. Ändert jemand
  // anderes den Termin (Rollen, Beenden), schließt sie sich damit von selbst.
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const running = meeting.status === "running";
  const confirming = running && confirmVersion === meeting.version;
  const previewing = running && (confirming || hint);

  const endedByMe = useRef(false);
  const end: EndControls = {
    confirming,
    openConfirm: () => setConfirmVersion(meeting.version),
    closeConfirm: () => setConfirmVersion(null),
    setHint,
    markEndedByMe: () => {
      endedByMe.current = true;
    },
  };

  const boardRef = useRef<HTMLDivElement>(null);
  useCardShift(boardRef, meeting.number, ({ animated }) => {
    // Wer selbst beendet hat, bekommt schon den Hinweis mit der neuen Moderation.
    if (!animated && !endedByMe.current) {
      toast.info(`Termin ${meeting.number - 1} beendet – die Themen sind weitergerückt.`);
    }
    endedByMe.current = false;
  });

  const previewFor = (column: Column): EndPreview => (!previewing ? null : column === 3 ? "archive" : "advance");

  return (
    <div className={cn("grid gap-5", confirming && "pb-32")}>
      <MeetingBar slug={slug} board={board} end={end} />

      <div ref={boardRef} className="grid gap-4 md:grid-cols-3" data-previewing={previewing || undefined}>
        {columns.map((column) => {
          const life = lifecycle(column, meeting.number);
          const cards = board.cards.filter((c) => c.column === column);
          const last = column === 3;
          return (
            <div key={column} className="relative">
              <section
                aria-label={life.title}
                data-testid={`column-${column}`}
                className={cn(
                  "flex h-full flex-col gap-2.5 rounded-xl p-3 md:min-h-72",
                  last ? "bg-last-round" : "bg-column",
                )}
              >
                <header className="flex min-h-10 items-center gap-2.5 px-0.5">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-card text-xs font-semibold tabular-nums",
                      last ? "border-last-round-accent text-last-round-foreground" : "border-primary/40 text-primary",
                    )}
                    aria-hidden
                  >
                    {column}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm leading-tight font-semibold">
                      {life.title}{" "}
                      <span className="font-normal text-muted-foreground tabular-nums">({cards.length})</span>
                    </h2>
                    <p
                      className={cn(
                        "text-xs tabular-nums",
                        last ? "font-medium text-last-round-foreground" : "text-muted-foreground",
                      )}
                      data-testid="column-until"
                    >
                      {life.until}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center">
                    {column === 1 && (
                      <Button size="sm" variant="ghost" onClick={() => setDialog({ open: true, cardId: null })}>
                        <PlusIcon aria-hidden />
                        Thema
                      </Button>
                    )}
                    {last && (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          previewing ? "font-medium text-last-round-foreground" : "text-muted-foreground",
                        )}
                      >
                        <ChevronRightIcon className="size-3.5" aria-hidden />
                        <ArchiveIcon className="size-3.5" aria-hidden />
                        Archiv
                      </span>
                    )}
                  </div>
                </header>

                {cards.map((card) => (
                  <TopicCard
                    key={card.id}
                    card={card}
                    meetingNumber={meeting.number}
                    preview={previewFor(column)}
                    onOpen={() => setDialog({ open: true, cardId: card.id })}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    {column === 1 ? "Noch keine neuen Themen." : "Keine Themen in dieser Runde."}
                  </p>
                )}
              </section>

              {/* Verbindung zum nächsten Schritt: auf dem Desktop im Spaltenabstand, mobil als Linie */}
              {!last && (
                <>
                  <span
                    className={cn(
                      "absolute top-6 -right-4 z-10 hidden w-4 justify-center md:flex",
                      previewing ? "text-primary" : "text-muted-foreground/60",
                    )}
                    aria-hidden
                  >
                    <ChevronRightIcon className="size-4" />
                  </span>
                  <span
                    className={cn("mt-2 -mb-2 ml-[1.55rem] block h-4 w-0.5 md:hidden", previewing ? "bg-primary" : "bg-border")}
                    aria-hidden
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <CardDialog
        slug={slug}
        board={board}
        card={openCard}
        open={dialogOpen}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  );
}
