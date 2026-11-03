import type { BoardView, Participant, UserRef } from "@looptalk/shared";
import { ChevronsUpDownIcon, ChevronUpIcon, PlayIcon, SquareIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/person";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDuration } from "@/lib/format";
import { useBoardActions } from "@/lib/queries";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

export interface EndControls {
  /** Bestätigung zum Beenden ist offen. */
  confirming: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  /** Hover oder Fokus auf „Termin beenden“: Vorschau als Andeutung. */
  setHint: (hint: boolean) => void;
  /** Wird vor dem eigenen Beenden aufgerufen, damit kein doppelter Hinweis erscheint. */
  markEndedByMe: () => void;
}

function RoleSelect({
  label,
  value,
  options,
  blockedId,
  blockedLabel,
  allowNone,
  onChange,
}: {
  label: string;
  value: UserRef | null;
  options: Participant[];
  blockedId: number | null;
  blockedLabel: string;
  allowNone?: boolean;
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const inactive = value && !options.some((p) => p.id === value.id);

  const choose = (id: number | null) => {
    setOpen(false);
    if (id !== (value?.id ?? null)) onChange(id);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            className="w-48 justify-between gap-2 bg-card font-medium"
          >
            <span className="flex min-w-0 items-center gap-2">
              {value ? (
                <>
                  <PersonAvatar name={value.name} userId={value.id} size="sm" className="-ml-1 size-6" aria-hidden />
                  <span className="truncate">{value.name}</span>
                </>
              ) : (
                <span className="truncate text-muted-foreground">nicht festgelegt</span>
              )}
            </span>
            <ChevronsUpDownIcon aria-hidden className="opacity-50" />
          </Button>
        </PopoverTrigger>
        {/* Nach oben: Das Dock liegt am unteren Rand. */}
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start" side="top">
          <Command>
            <CommandInput placeholder="Person suchen …" />
            <CommandList className="max-h-80">
              <CommandEmpty>Niemand gefunden</CommandEmpty>
              {allowNone && (
                <CommandGroup>
                  <CommandItem value="nicht festgelegt" data-checked={!value} className="h-10" onSelect={() => choose(null)}>
                    <span className="text-muted-foreground">nicht festgelegt</span>
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup heading={allowNone ? "Personen" : undefined}>
                {inactive && <RoleOption person={value} hint="inaktiv" checked disabled />}
                {options.map((p) => (
                  <RoleOption
                    key={p.id}
                    person={p}
                    hint={p.id === blockedId ? blockedLabel : undefined}
                    checked={p.id === value?.id}
                    disabled={p.id === blockedId}
                    onSelect={() => choose(p.id)}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function RoleOption({
  person,
  hint,
  checked,
  disabled,
  onSelect,
}: {
  person: UserRef;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <CommandItem
      value={`${person.name} ${person.id}`}
      data-checked={checked}
      disabled={disabled}
      className="h-10 gap-2.5"
      onSelect={onSelect}
    >
      <PersonAvatar name={person.name} userId={person.id} size="sm" className="size-6" aria-hidden />
      <span className="truncate">{person.name}</span>
      {hint && <span className="ml-auto text-xs text-muted-foreground">{hint}</span>}
    </CommandItem>
  );
}

/** Termin-Dock: schwebt unten auf der Wand, die Bestätigung zum Beenden klappt darin auf. */
export function MeetingBar({ slug, board, end }: { slug: string; board: BoardView; end: EndControls }) {
  const { meeting, participants } = board;
  const actions = useBoardActions(slug);
  const now = useNow(30_000);
  const active = participants.filter((p) => p.active);
  const running = meeting.status === "running";
  // Auf schmalen Bildschirmen sind Rollen und Hinweis eingeklappt.
  const [rolesOpen, setRolesOpen] = useState(false);

  const changeRoles = (moderatorId: number, protocolId: number | null) =>
    actions.setRoles.mutate({ moderatorId, protocolId, version: meeting.version });

  return (
    <section
      aria-label="Aktueller Termin"
      data-state={meeting.status}
      data-testid="meeting-dock"
      className={cn(
        "glass grid gap-3 rounded-2xl px-3 py-3 transition-colors motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 sm:px-4",
        running && "border-l-4 border-l-primary ring-1 ring-primary/20",
      )}
    >
      {board.tooFewParticipants && (
        <p className="flex items-start gap-2 text-sm text-warning-foreground">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Für die Rotation werden mindestens zwei aktive Teilnehmer benötigt.</span> Teile
            den Link zum Board, damit weitere Personen beitreten können.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 md:gap-x-6">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-semibold tracking-tight tabular-nums">Termin {meeting.number}</span>
          {running ? (
            <Badge className="gap-1.5 tabular-nums" data-testid="meeting-duration">
              <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" aria-hidden />
              {/* Auf dem Handy nur die Minuten, damit das Dock einzeilig bleibt. */}
              <span className="hidden sm:inline">Läuft {formatDuration(meeting.startedAt!, now)}</span>
              <span className="sm:hidden">{formatDuration(meeting.startedAt!, now).replace(/^seit /, "")}</span>
            </Badge>
          ) : (
            <Badge variant="outline">Geplant</Badge>
          )}
        </div>

        <div
          id="dock-roles"
          className={cn("flex-wrap items-center gap-x-5 gap-y-2 md:flex", rolesOpen ? "order-last flex basis-full" : "hidden")}
        >
          <RoleSelect
            label="Moderation"
            value={meeting.moderator}
            options={active}
            blockedId={meeting.protocol?.id ?? null}
            blockedLabel="Protokoll"
            onChange={(id) => id !== null && changeRoles(id, meeting.protocol?.id ?? null)}
          />
          <RoleSelect
            label="Protokoll"
            value={meeting.protocol}
            options={active}
            blockedId={meeting.moderator.id}
            blockedLabel="Moderation"
            allowNone
            onChange={(id) => changeRoles(meeting.moderator.id, id)}
          />
          <p className="text-sm text-muted-foreground" data-testid="next-protocol-hint">
            <span className="font-medium text-foreground">{meeting.moderator.name}</span> protokolliert beim nächsten
            Termin
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={rolesOpen ? "Rollen ausblenden" : "Rollen anzeigen"}
            aria-expanded={rolesOpen}
            aria-controls="dock-roles"
            onClick={() => setRolesOpen((v) => !v)}
          >
            <ChevronUpIcon className={cn("transition-transform", rolesOpen && "rotate-180")} aria-hidden />
          </Button>
          {running ? (
            <Button
              className="max-sm:h-8 max-sm:px-2.5"
              onClick={end.openConfirm}
              // Erst bei echter Mausbewegung: Der Button erscheint nach „Termin starten“ direkt unter dem Zeiger.
              onPointerMove={() => end.setHint(true)}
              onPointerLeave={() => end.setHint(false)}
              onFocus={() => end.setHint(true)}
              onBlur={() => end.setHint(false)}
              disabled={actions.end.isPending || end.confirming}
              aria-haspopup="dialog"
            >
              <SquareIcon aria-hidden />
              Termin beenden
            </Button>
          ) : (
            <Button
              className="max-sm:h-8 max-sm:px-2.5"
              onClick={() => actions.start.mutate(meeting.version)}
              disabled={actions.start.isPending}
            >
              <PlayIcon aria-hidden />
              Termin starten
            </Button>
          )}
        </div>
      </div>

      {end.confirming && (
        <EndConfirm
          board={board}
          pending={actions.end.isPending}
          onCancel={end.closeConfirm}
          onConfirm={() => {
            end.markEndedByMe();
            actions.end.mutate(meeting.version, {
              onSuccess: (next) =>
                toast.success(`Termin ${meeting.number} beendet`, {
                  description: `Neue Moderation: ${next.moderator.name}. Protokoll: ${next.protocol?.name ?? "nicht festgelegt"}.`,
                }),
              onSettled: end.closeConfirm,
            });
          }}
        />
      )}
    </section>
  );
}

/**
 * Nicht modale Bestätigung, die im Dock aufklappt: Das Board bleibt sichtbar und zeigt
 * die Vorschau, was beim Beenden passiert.
 */
function EndConfirm({
  board,
  pending,
  onCancel,
  onConfirm,
}: {
  board: BoardView;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { meeting, cards } = board;
  const advancing = cards.filter((c) => c.column < 3).length;
  const archived = cards.length - advancing;
  const notDiscussed = cards.filter((c) => c.column === 3 && !c.discussed).map((c) => c.title);

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="end-confirm-title"
      aria-describedby="end-confirm-description"
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/60 pt-3">
        <div className="min-w-60 flex-1">
          <p id="end-confirm-title" className="font-semibold">
            Termin {meeting.number} beenden?
          </p>
          <p id="end-confirm-description" className="text-sm text-muted-foreground">
            {cards.length === 0
              ? "Keine Themen auf dem Board."
              : `${advancing === 1 ? "1 Thema rückt" : `${advancing} Themen rücken`} weiter, ${archived} ${archived === 1 ? "wird" : "werden"} archiviert.`}{" "}
            {meeting.moderator.name} protokolliert beim nächsten Termin. Die neue Moderation wird gezogen.
          </p>
          {notDiscussed.length > 0 && (
            <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-last-round-foreground" data-testid="end-not-discussed">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              Nicht besprochen und wird archiviert: {notDiscussed.join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Fokus auf „Abbrechen“, wie bei Bestätigungsdialogen üblich */}
          <Button variant="outline" onClick={onCancel} autoFocus>
            Abbrechen
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            Termin beenden
          </Button>
        </div>
      </div>
    </div>
  );
}
