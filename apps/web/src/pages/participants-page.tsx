import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { useBoardActions } from "@/lib/queries";
import { useBoardContext } from "./board-layout";

export function ParticipantsPage() {
  const { slug, board } = useBoardContext();
  const { setActive } = useBoardActions(slug);

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Inaktive Teilnehmer werden nicht als Moderation gezogen und stehen nicht zur Auswahl für die Rollen.
      </p>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Beigetreten</TableHead>
              <TableHead className="w-28">Aktiv</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {board.participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(p.joinedAt)}</TableCell>
                <TableCell>
                  <Switch
                    checked={p.active}
                    aria-label={`${p.name} aktiv`}
                    onCheckedChange={(active) => setActive.mutate({ userId: p.id, active })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
