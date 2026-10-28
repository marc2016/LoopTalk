import { CheckCircle2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { columnTitle } from "@/lib/lifecycle";
import { useHistory } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useBoardContext } from "./board-layout";

export function HistoryPage() {
  const { slug } = useBoardContext();
  const history = useHistory(slug);

  if (!history.data) return <p className="text-muted-foreground">Lade Historie …</p>;
  if (history.data.length === 0) {
    return <p className="text-muted-foreground">Noch keine beendeten Termine.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Nr.</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Moderation</TableHead>
            <TableHead>Protokoll</TableHead>
            <TableHead>Themen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.data.map((m) => (
            <TableRow key={m.id} className="align-top">
              <TableCell className="font-medium">{m.number}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(m.endedAt)}</TableCell>
              <TableCell>{m.moderator.name}</TableCell>
              <TableCell>{m.protocol?.name ?? "–"}</TableCell>
              <TableCell className="whitespace-normal">
                {m.cards.length === 0 ? (
                  <span className="text-muted-foreground">keine</span>
                ) : (
                  <ul className="grid gap-1.5">
                    {m.cards.map((c) => (
                      <li
                        key={c.cardId}
                        className={cn("flex flex-wrap items-center gap-2", !c.discussed && "text-muted-foreground")}
                        data-discussed={c.discussed}
                      >
                        <Badge variant="outline">{columnTitle(c.column)}</Badge>
                        <span>{c.title}</span>
                        {c.discussed ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2Icon className="size-3.5" aria-hidden />
                            besprochen
                          </span>
                        ) : (
                          <span className="text-xs">nicht besprochen</span>
                        )}
                        {c.people.length > 0 && (
                          <span className="text-muted-foreground">({c.people.join(", ")})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
