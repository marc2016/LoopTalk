import type { Column } from "@looptalk/shared";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CardDialog } from "@/components/card-dialog";
import { MeetingBar } from "@/components/meeting-bar";
import { TopicCard } from "@/components/topic-card";
import { Button } from "@/components/ui/button";
import { columnTitles } from "@/lib/format";
import { useBoardContext } from "./board-layout";

const columns: Column[] = [1, 2, 3];

export function BoardPage() {
  const { slug, board } = useBoardContext();
  const [dialog, setDialog] = useState<{ open: boolean; cardId: number | null }>({ open: false, cardId: null });
  // Die Karte immer aus dem aktuellen Stand lesen, damit Änderungen anderer sofort sichtbar sind.
  const openCard = dialog.cardId === null ? null : (board.cards.find((c) => c.id === dialog.cardId) ?? null);
  const dialogOpen = dialog.open && (dialog.cardId === null || openCard !== null);

  return (
    <div className="grid gap-5">
      <MeetingBar slug={slug} board={board} />

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((column) => {
          const cards = board.cards.filter((c) => c.column === column);
          return (
            <section
              key={column}
              aria-label={columnTitles[column]}
              data-testid={`column-${column}`}
              className="flex flex-col gap-3 rounded-xl bg-column p-3 md:min-h-64"
            >
              <header className="flex h-8 items-center justify-between px-1">
                <h2 className="text-sm font-semibold">
                  {columnTitles[column]} <span className="font-normal text-muted-foreground">({cards.length})</span>
                </h2>
                {column === 1 && (
                  <Button size="sm" variant="ghost" onClick={() => setDialog({ open: true, cardId: null })}>
                    <PlusIcon aria-hidden />
                    Thema
                  </Button>
                )}
              </header>
              {cards.map((card) => (
                <TopicCard key={card.id} card={card} onOpen={() => setDialog({ open: true, cardId: card.id })} />
              ))}
              {cards.length === 0 && (
                <p className="px-1 text-sm text-muted-foreground">
                  {column === 1 ? "Noch keine neuen Themen." : "Keine Themen."}
                </p>
              )}
            </section>
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
