import type { BoardView } from "@looptalk/shared";
import { PlayIcon, SquareIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime } from "@/lib/format";
import { useBoardActions } from "@/lib/queries";

const NONE = "none";

export function MeetingBar({ slug, board }: { slug: string; board: BoardView }) {
  const { meeting, participants } = board;
  const actions = useBoardActions(slug);
  const active = participants.filter((p) => p.active);
  const running = meeting.status === "running";

  const changeRoles = (moderatorId: number, protocolId: number | null) =>
    actions.setRoles.mutate({ moderatorId, protocolId, version: meeting.version });

  const end = () =>
    actions.end.mutate(meeting.version, {
      onSuccess: (next) =>
        toast.success(`Termin ${meeting.number} beendet`, {
          description: `Neue Moderation: ${next.moderator.name}. Protokoll: ${next.protocol?.name ?? "nicht festgelegt"}.`,
        }),
    });

  return (
    <div className="grid gap-3">
      {board.tooFewParticipants && (
        <Alert className="border-warning-foreground/20 bg-warning text-warning-foreground">
          <TriangleAlertIcon aria-hidden />
          <AlertTitle>Für die Rotation werden mindestens zwei aktive Teilnehmer benötigt</AlertTitle>
          <AlertDescription className="text-warning-foreground/90">
            Teile den Link zum Board, damit weitere Personen beitreten können.
          </AlertDescription>
        </Alert>
      )}

      <section
        aria-label="Aktueller Termin"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card px-4 py-3 shadow-xs"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">Termin {meeting.number}</span>
          {running ? (
            <Badge className="gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" aria-hidden />
              Läuft seit {formatTime(meeting.startedAt!)}
            </Badge>
          ) : (
            <Badge variant="secondary">Geplant</Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Moderation</span>
            <Select
              value={String(meeting.moderator.id)}
              onValueChange={(v) => changeRoles(Number(v), meeting.protocol?.id ?? null)}
            >
              <SelectTrigger size="sm" className="min-w-36 font-medium" aria-label="Moderation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!active.some((p) => p.id === meeting.moderator.id) && (
                  <SelectItem value={String(meeting.moderator.id)} disabled>
                    {meeting.moderator.name} (inaktiv)
                  </SelectItem>
                )}
                {active.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} disabled={p.id === meeting.protocol?.id}>
                    {p.name}
                    {p.id === meeting.protocol?.id && " (Protokoll)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Protokoll</span>
            <Select
              value={meeting.protocol ? String(meeting.protocol.id) : NONE}
              onValueChange={(v) => changeRoles(meeting.moderator.id, v === NONE ? null : Number(v))}
            >
              <SelectTrigger size="sm" className="min-w-36 font-medium" aria-label="Protokoll">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>nicht festgelegt</SelectItem>
                {meeting.protocol && !active.some((p) => p.id === meeting.protocol!.id) && (
                  <SelectItem value={String(meeting.protocol.id)} disabled>
                    {meeting.protocol.name} (inaktiv)
                  </SelectItem>
                )}
                {active.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} disabled={p.id === meeting.moderator.id}>
                    {p.name}
                    {p.id === meeting.moderator.id && " (Moderation)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <p className="text-sm text-muted-foreground" data-testid="next-protocol-hint">
            <span className="font-medium text-foreground">{meeting.moderator.name}</span> protokolliert beim nächsten
            Termin
          </p>
        </div>

        <div className="ml-auto">
          {running ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={actions.end.isPending}>
                  <SquareIcon aria-hidden />
                  Termin beenden
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Termin {meeting.number} beenden?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Alle Themen rücken eine Spalte weiter, Themen aus „Letzter Termin“ werden archiviert.{" "}
                    {meeting.moderator.name} protokolliert beim nächsten Termin, die neue Moderation wird gezogen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={end}>Termin beenden</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={() => actions.start.mutate(meeting.version)} disabled={actions.start.isPending}>
              <PlayIcon aria-hidden />
              Termin starten
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
