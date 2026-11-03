import type { Column } from "@looptalk/shared";
import { ArchiveIcon, PlusIcon } from "lucide-react";
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
import { useDockHeight } from "@/lib/use-dock-height";
import { useLandingCards } from "@/lib/use-landing-cards";
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
  // Wird in meiner eigenen Ansicht gerade ein Feld bearbeitet? Meldet der Zettel selbst.
  const [personalEditing, setPersonalEditing] = useState(false);
  const personalBusy = personalOpen && (sheet.mode === "create" || personalEditing);

  // Gemeinsamer Fokus: öffnet sich, solange ich ihn nicht selbst geschlossen habe und nicht beschäftigt bin.
  const [dismissedFocus, setDismissedFocus] = useState<string | null>(null);
  const otherDialogOpen = useOtherDialogOpen();
  const focus = meeting.focus;
  const focusKey = focus ? `${focus.cardId}:${focus.since}` : null;
  const focusCard = focus ? (board.cards.find((c) => c.id === focus.cardId) ?? null) : null;
  const busy = personalBusy || otherDialogOpen;
  const focusOpen = focus !== null && focusCard !== null && focusKey !== dismissedFocus && !busy;
  // Geht die Fokusansicht über einer persönlichen Ansicht ohne laufende Eingabe auf, ersetzt sie diese
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

  const { landing, landed } = useLandingCards(board.cards.map((c) => c.id));

  // Fester Stapel unten (Fokus-Toast + Dock): Seine Höhe wird zum Innenabstand der Wand.
  const dockRef = useRef<HTMLDivElement>(null);
  useDockHeight(dockRef);

  const previewFor = (column: Column): EndPreview => (!previewing ? null : column === 3 ? "archive" : "advance");

  return (
    <>

      {/* Eine Wand für alle drei Spalten: Etiketten, Trennlinien, Schein und Ablage statt Kästen */}
      <div
        ref={boardRef}
        // Randlos: Die Wand ist die Seite; unten so viel Innenabstand, wie das Dock hoch ist. Die
        // Mindesthöhe gilt für den Inhalt (box-content), damit ein wachsendes Dock nur die Seite
        // verlängert und nichts auf dem Board springt.
        className="wall box-content grid min-h-[calc(100dvh-var(--bar-h)-11.25rem)] px-4 pt-5 pb-[calc(var(--dock-h)+2rem)] md:grid-cols-3 md:px-6"
        data-testid="board-wall"
        data-wall={board.wall}
        data-previewing={previewing || undefined}
      >
        {columns.map((column) => {
          const life = lifecycle(column, meeting.number);
          const cards = board.cards.filter((c) => c.column === column);
          const last = column === 3;
          return (
            <section
              key={column}
              aria-label={life.title}
              data-testid={`column-${column}`}
              data-last-round={last || undefined}
              className={cn(
                "relative isolate flex flex-col gap-4 md:min-h-80",
                column > 1 && "mt-6 border-t border-wall-line pt-6 md:mt-0 md:border-t-0 md:border-l md:pt-0 md:pl-5",
                !last && "md:pr-5",
              )}
            >
              <header className="flex min-h-10 flex-wrap items-start gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <div className="wall-label" data-column={column} data-last-round={last || undefined}>
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-card text-xs font-semibold tabular-nums",
                        last ? "border-last-round-accent text-last-round-foreground" : "border-primary/40 text-primary",
                      )}
                      aria-hidden
                    >
                      {column}
                    </span>
                    <h2 className="text-sm leading-none font-semibold">{life.title}</h2>
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-semibold tabular-nums",
                        last ? "bg-last-round-foreground/15 text-last-round-foreground" : "bg-foreground/8 text-foreground",
                      )}
                      data-testid="column-count"
                    >
                      <span className="sr-only">Themen: </span>
                      {cards.length}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1.5 px-1 text-xs tabular-nums",
                      last ? "font-medium text-last-round-foreground" : "text-wall-muted",
                    )}
                    data-testid="column-until"
                  >
                    {life.until}
                  </p>
                </div>
                {column === 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setSheet({ mode: "create", cardId: null })}
                  >
                    <PlusIcon aria-hidden />
                    Thema
                  </Button>
                )}
              </header>

              {last && <span className="wall-glow" aria-hidden />}

              {/* Zettel quadratisch, je zwei nebeneinander */}
              <div className="grid grid-cols-2 gap-4" data-testid="note-grid">
                {cards.map((card) => (
                  <TopicCard
                    key={card.id}
                    card={card}
                    meetingNumber={meeting.number}
                    preview={previewFor(column)}
                    landing={landing.has(card.id)}
                    onLanded={() => landed(card.id)}
                    onOpen={() => setSheet({ mode: "view", cardId: card.id })}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="note-ghost" data-testid="note-ghost">
                    {column === 1 ? "Noch keine neuen Themen." : "Keine Themen in dieser Runde."}
                  </p>
                )}
              </div>

              {last && (
                <p className="wall-tray" data-testid="archive-tray">
                  <ArchiveIcon className="size-3.5" aria-hidden />
                  Archiv
                </p>
              )}
            </section>
          );
        })}
      </div>

      {/* Schwebende Bedienung unten: Fokus-Toast über dem Termin-Dock, mit sicherem Bereich des Geräts */}
      <div
        ref={dockRef}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="pointer-events-auto mx-auto grid max-w-4xl gap-2">
          {focus && focusCard && !focusOpen && (
            <FocusBar
              by={focus.by}
              title={focusCard.title}
              busy={busy}
              onShow={() => {
                setDismissedFocus(null);
                if (personalBusy) return;
                setSheet(null);
              }}
              onEnd={() => actions.unfocus.mutate(undefined)}
            />
          )}
          <MeetingBar slug={slug} board={board} end={end} />
        </div>
      </div>

      {focusOpen ? (
        // Fokusansicht ersetzt eine offene Detailansicht; bearbeitet wird direkt darin.
        <CardSheet
          key={`focus:${focusKey}`}
          slug={slug}
          board={board}
          card={focusCard}
          mode="view"
          focusBy={focus.by}
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
            onBusyChange={setPersonalEditing}
            onCreated={() => setSheet(null)}
            onFocused={() => setSheet(null)}
            onClose={() => setSheet(null)}
          />
        )
      )}
    </>
  );
}
