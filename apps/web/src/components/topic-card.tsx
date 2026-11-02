import type { CardView, Column } from "@looptalk/shared";
import { ArchiveIcon, ArrowRightIcon } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { PersonBadge } from "@/components/person";
import { columnTitle, lifecycle } from "@/lib/lifecycle";
import { noteAge, noteTilt } from "@/lib/note";
import { cn } from "@/lib/utils";

/** Was beim Beenden des Termins mit der Karte passiert (nur während der Vorschau). */
export type EndPreview = "advance" | "archive" | null;

/** Drei Punkte, davon so viele gefüllt, wie die Karte noch Termine hat. */
function LifeDots({ remaining, last }: { remaining: number; last: boolean }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            i < remaining ? (last ? "bg-last-round-accent" : "bg-note-foreground/60") : "bg-note-foreground/15",
          )}
        />
      ))}
    </span>
  );
}

/** Haken, der sich selbst zeichnet, wenn `animate` gesetzt ist (nur bei Wechsel während der Sitzung). */
function DrawnCheck({ animate }: { animate: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="check-drawn size-3.5 shrink-0 text-emerald-700"
      data-animate={animate || undefined}
      aria-hidden
    >
      <path
        d="M2.5 8.5 C4 9.5 5.5 11 6.5 12.5 C8.5 8.5 11 5.5 13.5 3"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TopicCard({
  card,
  meetingNumber,
  preview = null,
  landing = false,
  onLanded,
  onOpen,
}: {
  card: CardView;
  meetingNumber: number;
  preview?: EndPreview;
  /** Neu aufs Board gekommen: landet mit einer kurzen Animation. */
  landing?: boolean;
  onLanded?: () => void;
  onOpen: () => void;
}) {
  const life = lifecycle(card.column, meetingNumber);
  const last = life.remaining === 1;

  // Den Haken nur zeichnen, wenn „besprochen“ hier gerade eingeschaltet wurde, nicht beim Laden.
  const [seenDiscussed, setSeenDiscussed] = useState(card.discussed);
  const [drawCheck, setDrawCheck] = useState(false);
  if (card.discussed !== seenDiscussed) {
    setSeenDiscussed(card.discussed);
    setDrawCheck(card.discussed);
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="topic-card"
      data-card-id={card.id}
      data-preview={preview ?? undefined}
      data-color={card.color}
      data-age={noteAge(card.column)}
      data-landing={landing || undefined}
      onAnimationEnd={(e) => {
        if (e.animationName === "note-land") onLanded?.();
      }}
      style={{ "--tilt": `${noteTilt(card.id)}deg` } as CSSProperties}
      className={cn(
        "note-paper note flex aspect-square w-full flex-col overflow-hidden text-left",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        // Vorschau: Zettel deuten das Weiterrücken an, archivierte blenden halb aus.
        preview === "advance" && "motion-safe:translate-x-1.5",
        preview === "archive" && "opacity-55 motion-safe:translate-x-2.5",
      )}
    >
      {preview && (
        <span
          // Als Etikett am Rand, damit die Karte nicht höher wird und nichts springt.
          className={cn(
            "absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium shadow-xs",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:duration-300",
            preview === "archive"
              ? "border-last-round-accent/40 bg-last-round text-last-round-foreground"
              : "border-primary/20 bg-running text-primary",
          )}
        >
          {preview === "archive" ? (
            <>
              <ArchiveIcon className="size-3" aria-hidden />
              wird archiviert
            </>
          ) : (
            <>
              <ArrowRightIcon className="size-3" aria-hidden />
              {columnTitle((card.column + 1) as Column)}
            </>
          )}
        </span>
      )}

      <p className="line-clamp-3 shrink-0 leading-snug font-medium break-words">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-3 min-h-0 text-sm leading-snug break-words whitespace-pre-line text-note-muted">
          {card.description}
        </p>
      )}
      {card.people.length > 0 && (
        <div className="mt-2 flex max-h-12 flex-wrap gap-1 overflow-hidden" aria-label="Namen">
          {card.people.map((p) => (
            <PersonBadge key={p.id} name={p.name} userId={p.userId} onNote />
          ))}
        </div>
      )}

      {/* Fußzeile sitzt unten auf dem Quadrat, egal wie viel Text darüber steht. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2 text-xs text-note-muted">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate">von {card.createdBy.name}</span>
          {card.discussed && (
            <span className="flex shrink-0 items-center gap-1 font-medium text-note-foreground" data-testid="card-discussed">
              <DrawnCheck animate={drawCheck} />
              heute besprochen
            </span>
          )}
        </span>
        <span
          className={cn("flex shrink-0 items-center gap-1.5", last && "font-semibold text-note-foreground")}
          data-testid="card-life"
        >
          <LifeDots remaining={life.remaining} last={last} />
          {life.cardLabel}
        </span>
      </div>
    </button>
  );
}
