import { describeAudit } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import { useCardAudit } from "@/lib/queries";

export function CardHistory({ slug, cardId }: { slug: string; cardId: number }) {
  const history = useCardAudit(slug, cardId);
  if (!history.data) return <p className="text-sm text-muted-foreground">Lade Verlauf …</p>;

  return (
    <ol className="grid gap-2 text-sm" aria-label="Verlauf des Themas">
      {history.data.map((entry) => {
        const { text, details } = describeAudit(entry);
        return (
          <li key={entry.id} className="border-l-2 border-border pl-3">
            <p>
              <span className="font-medium">{entry.actor.name}</span> {text}
            </p>
            {details.map((d) => (
              <p key={d} className="text-muted-foreground">
                {d}
              </p>
            ))}
            <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
          </li>
        );
      })}
    </ol>
  );
}
