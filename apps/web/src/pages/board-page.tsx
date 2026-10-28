import type { Column } from "@looptalk/shared";
import { ArchiveIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CardSheet, type SheetMode } from "@/components/card-sheet";
import { FocusBar } from "@/components/focus-bar";
import { type EndControls, MeetingBar } from "@/components/meeting-bar";
import { type EndPreview, TopicCard } from "@/components/topic-card";
import { Button } from "@/components/ui/button";
import { columns, lifecycle } from "@/lib/lifecycle";
import { useBoardActions } from "@/lib/queries";
import { useCardShift } from "@/lib/use-card-shift";
import { useOtherDialogOpen } from "@/lib/use-other-dialog-open";
import { cn } from "@/lib/utils";
import { useBoardContext } from "./board-layout";

export function BoardPage() {
  const { slug, board } = useBoardContext();
  const { meeting } = board;
  const actions = useBoardActions(slug);

  // Persönliche Karten-Ansicht. Die Karte immer aus dem aktuellen Stand lesen, damit
  // Änderungen anderer sofort sichtbar sind.
  const [sheet, setSheet] = useState<{ mode: SheetMode; cardId: number | null } | null>(null);
  const sheetCard = sheet?.cardId != null ? (board.cards.find((c) => c.id === sheet.cardId) ?? null) : null;
  const sheetGone = sheet !== null && sheet.cardId !== null && sheetCard === null;
  const personalOpen = sheet !== null && !sheetGone;

  // Gemeinsamer Fokus: öffnet sich, solange ich ihn nicht selbst geschlossen habe und nicht beschäftigt bin.
  const [dismissedFocus, setDismissedFocus] = useState<string | null>(null);
  const otherDialogOpen = useOtherDialogOpen();
  const focus = meeting.focus;
  const focusKey = focus ? `${focus.cardId}:${focus.since}` : null;
  const focusCard = focus ? (board.cards.find((c) => c.id === focus.cardId) ?? null) : null;
  const busy = (personalOpen && sheet.mode !== "view") || otherDialogOpen;
  const focusOpen = focus !== null && focusCard !== null && focusKey !== dismissedFocus && !busy;
  // Geht die Fokusansicht über einer persönlichen Ansicht im Lese-Modus auf, ersetzt sie diese
  // endgültig: Nach dem Schließen des Fokus kommt nicht die alte Ansicht wieder hervor.
  if (focusOpen && sheet?.mode === "view") setSheet(null);

  // Gelöschte oder archivierte Karte: Ansicht schließt sich (abgeleitet), einmal Hinweis zeigen.
  const notifiedGone = useRef<number | null>(null);
  useEffect(() => {
    if (sheetGone && notifiedGone.current !== sheet.cardId) {
      notifiedGone.current = sheet.cardId;
      toast.info("Das Thema ist nicht mehr auf dem Board.");
    }
  }, [sheetGone, sheet]);

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
      {focus && focusCard && !focusOpen && (
        <FocusBar
          by={focus.by}
          title={focusCard.title}
          busy={busy}
          onShow={() => {
            setDismissedFocus(null);
            if (personalOpen && sheet.mode !== "view") return;
            setSheet(null);
          }}
          onEnd={() => actions.unfocus.mutate(undefined)}
        />
      )}

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
                  "flex h-full flex-col gap-3.5 rounded-xl p-3 md:min-h-72",
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
                      <Button size="sm" variant="ghost" onClick={() => setSheet({ mode: "create", cardId: null })}>
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
                    onOpen={() => setSheet({ mode: "view", cardId: card.id })}
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
                      "absolute top-6 -right-4 z-10 hidden w-4 justify-center transition-colors md:flex",
                      previewing ? "text-primary motion-safe:animate-nudge" : "text-muted-foreground/60",
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

      {focusOpen ? (
        // Fokusansicht ersetzt eine offene Detailansicht; Bearbeiten wechselt in die eigene Ansicht.
        <CardSheet
          key={`focus:${focusKey}`}
          slug={slug}
          board={board}
          card={focusCard}
          mode="view"
          focusBy={focus.by}
          onModeChange={(mode) => setSheet({ mode, cardId: focusCard.id })}
          onCreated={() => undefined}
          onClose={() => setDismissedFocus(focusKey)}
        />
      ) : (
        personalOpen && (
          <CardSheet
            key={`personal:${sheet.cardId ?? "new"}`}
            slug={slug}
            board={board}
            card={sheetCard}
            mode={sheet.mode}
            onModeChange={(mode) => setSheet({ mode, cardId: sheet.cardId })}
            onCreated={() => setSheet(null)}
            onFocused={() => setSheet(null)}
            onClose={() => setSheet(null)}
          />
        )
      )}
    </div>
  );
}
