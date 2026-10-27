import { type AuditAction, auditActions } from "@looptalk/shared";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actionLabels, describeAudit } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import { useAudit } from "@/lib/queries";
import { useBoardContext } from "./board-layout";

const ALL = "all";

export function AuditPage() {
  const { slug, board } = useBoardContext();
  const [actor, setActor] = useState<string>(ALL);
  const [action, setAction] = useState<string>(ALL);
  const audit = useAudit(slug, {
    actor: actor === ALL ? undefined : Number(actor),
    action: action === ALL ? undefined : action,
  });
  const entries = audit.data?.pages.flatMap((p) => p.entries) ?? [];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger className="min-w-44" aria-label="Filter nach Person">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Alle Personen</SelectItem>
            {board.participants.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="min-w-52" aria-label="Filter nach Aktion">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Alle Aktionen</SelectItem>
            {auditActions.map((a) => (
              <SelectItem key={a} value={a}>
                {actionLabels[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Zeitpunkt</TableHead>
              <TableHead className="w-48">Aktion</TableHead>
              <TableHead>Was ist passiert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const { text, details } = describeAudit(entry);
              return (
                <TableRow key={entry.id} className="align-top" data-testid="audit-entry">
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(entry.at)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{actionLabels[entry.action as AuditAction]}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="font-medium">{entry.actor.name}</span> {text}
                    {details.map((d) => (
                      <p key={d} className="text-sm text-muted-foreground">
                        {d}
                      </p>
                    ))}
                  </TableCell>
                </TableRow>
              );
            })}
            {audit.isSuccess && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Keine Einträge.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {audit.hasNextPage && (
        <Button
          variant="outline"
          className="justify-self-center"
          onClick={() => void audit.fetchNextPage()}
          disabled={audit.isFetchingNextPage}
        >
          Mehr laden
        </Button>
      )}
    </div>
  );
}
