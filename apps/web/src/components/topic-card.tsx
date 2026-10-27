import type { CardView } from "@looptalk/shared";
import { UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TopicCard({ card, onOpen }: { card: CardView; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="topic-card"
      className="w-full rounded-lg border bg-card p-3 text-left shadow-xs transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <p className="font-medium break-words">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-3 text-sm break-words whitespace-pre-line text-muted-foreground">
          {card.description}
        </p>
      )}
      {card.people.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <UsersIcon className="size-3.5 text-muted-foreground" aria-label="Namen" />
          {card.people.map((p) => (
            <Badge key={p.id} variant="secondary">
              {p.name}
            </Badge>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">von {card.createdBy.name}</p>
    </button>
  );
}
