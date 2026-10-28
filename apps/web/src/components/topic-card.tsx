import type { CardView, Column } from "@looptalk/shared";
import { ArchiveIcon, ArrowRightIcon } from "lucide-react";
import { PersonBadge } from "@/components/person";
import { columnTitle, lifecycle } from "@/lib/lifecycle";
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
            i < remaining ? (last ? "bg-last-round-accent" : "bg-primary/70") : "bg-border",
          )}
        />
      ))}
    </span>
  );
}

export function TopicCard({
  card,
  meetingNumber,
  preview = null,
  onOpen,
}: {
  card: CardView;
  meetingNumber: number;
  preview?: EndPreview;
  onOpen: () => void;
}) {
  const life = lifecycle(card.column, meetingNumber);
  const last = life.remaining === 1;

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="topic-card"
      data-card-id={card.id}
      data-preview={preview ?? undefined}
      className={cn(
        "relative w-full rounded-lg border bg-card p-3 text-left shadow-xs",
        "transition-[box-shadow,opacity,border-color,translate] duration-300 ease-out",
        "hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        last && "border-l-3 border-l-last-round-accent",
        // Vorschau: Karten deuten das Weiterrücken an, archivierte blenden halb aus.
        preview === "advance" && "motion-safe:translate-x-1.5",
        preview === "archive" && "border-dashed opacity-55 shadow-none motion-safe:translate-x-2.5",
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

      <p className="leading-snug font-medium break-words">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-3 text-sm leading-snug break-words whitespace-pre-line text-muted-foreground">
          {card.description}
        </p>
      )}
      {card.people.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1" aria-label="Namen">
          {card.people.map((p) => (
            <PersonBadge key={p.id} name={p.name} userId={p.userId} />
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">von {card.createdBy.name}</span>
        <span
          className={cn("flex shrink-0 items-center gap-1.5", last && "font-medium text-last-round-foreground")}
          data-testid="card-life"
        >
          <LifeDots remaining={life.remaining} last={last} />
          {life.cardLabel}
        </span>
      </div>
    </button>
  );
}
