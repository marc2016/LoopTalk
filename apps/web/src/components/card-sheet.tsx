import { zodResolver } from "@hookform/resolvers/zod";
import { type BoardView, type CardColor, type CardView, createCardSchema, type UserRef } from "@looptalk/shared";
import { CheckCircle2Icon, MonitorUpIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { CardHistory } from "@/components/card-history";
import { FieldError } from "@/components/field-error";
import { PeoplePicker } from "@/components/people-picker";
import { PersonAvatar, PersonBadge } from "@/components/person";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { lifecycle } from "@/lib/lifecycle";
import { noteAge, noteColorNames, noteColors } from "@/lib/note";
import { useBoardActions, useCardAudit } from "@/lib/queries";
import { useGrowFromCard } from "@/lib/use-grow-from-card";
import { cn } from "@/lib/utils";

export type SheetMode = "view" | "edit" | "create";

/** Footer liegt auf dem Papier: ohne eigene Fläche, Rand und überstehende Ränder des Dialogs. */
const paperFooter = "mx-0 mt-auto mb-0 rounded-none border-0 bg-transparent p-0 pt-2";
/** Eingabefeld, das wie Schrift auf dem Zettel wirkt: transparent, nur eine gestrichelte Linie. */
const paperField =
  "rounded-none border-0 border-b border-dashed border-note-foreground/25 bg-transparent px-0 text-note-foreground shadow-none placeholder:text-note-muted/70 focus-visible:border-solid focus-visible:border-note-foreground focus-visible:ring-0";

type FormInput = z.input<typeof createCardSchema>;
type FormOutput = z.output<typeof createCardSchema>;

/**
 * Großer Zettel: wächst aus dem kleinen Zettel auf dem Board. Lesen, Bearbeiten auf dem
 * Papier, Anlegen eines neuen Themas. Mit `focusBy` ist er die gemeinsame Fokusansicht.
 */
export function CardSheet({
  slug,
  board,
  card,
  mode,
  focusBy = null,
  onModeChange,
  onCreated,
  onFocused,
  onClose,
}: {
  slug: string;
  board: BoardView;
  /** `null` nur im Modus `create`. */
  card: CardView | null;
  mode: SheetMode;
  focusBy?: UserRef | null;
  onModeChange: (mode: SheetMode) => void;
  onCreated: (cardId: number) => void;
  /** Ich habe die Karte allen gezeigt: Die Fokusansicht übernimmt. */
  onFocused?: () => void;
  onClose: () => void;
}) {
  const { attach, close } = useGrowFromCard(card?.id ?? null);
  const requestClose = () => close(onClose);
  // Beim Bearbeiten färbt die gewählte Farbe das Papier sofort um, gespeichert wird erst später.
  const [draftColor, setDraftColor] = useState<CardColor | null>(null);
  const paperColor = (mode !== "view" && draftColor) || card?.color || "yellow";

  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <DialogContent
        ref={attach}
        data-card-sheet={focusBy ? "focus" : "personal"}
        data-color={paperColor}
        data-age={card ? noteAge(card.column) : 3}
        // Eigene Wachsen-Animation statt der eingebauten Zoom-Animation des Dialogs.
        style={{ animation: "none" }}
        className={cn(
          "note-paper note-big flex max-h-[90vh] flex-col gap-5 overflow-y-auto p-6 sm:min-h-[min(34rem,85vh)] sm:max-w-2xl sm:p-8",
          focusBy && "sm:max-w-3xl",
        )}
      >
        {mode === "view" && card ? (
          <CardDetails
            slug={slug}
            board={board}
            card={card}
            focusBy={focusBy}
            onEdit={() => onModeChange("edit")}
            onFocused={onFocused}
          />
        ) : (
          <CardForm
            slug={slug}
            board={board}
            card={card}
            onColorChange={setDraftColor}
            onCancel={() => (card ? onModeChange("view") : requestClose())}
            onSaved={(id) => (card ? onModeChange("view") : onCreated(id))}
            onDeleted={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CardDetails({
  slug,
  board,
  card,
  focusBy,
  onEdit,
  onFocused,
}: {
  slug: string;
  board: BoardView;
  card: CardView;
  focusBy: UserRef | null;
  onEdit: () => void;
  onFocused?: () => void;
}) {
  const actions = useBoardActions(slug);
  const { meeting } = board;
  const running = meeting.status === "running";
  const life = lifecycle(card.column, meeting.number);
  const isFocus = meeting.focus?.cardId === card.id;

  return (
    <>
      <DialogHeader className="gap-3">
        {focusBy && (
          <div className="flex items-center gap-2 text-sm font-medium text-primary" data-testid="focus-by">
            <PersonAvatar name={focusBy.name} userId={focusBy.id} className="size-6" aria-hidden />
            {focusBy.name} zeigt
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-note-muted">
          <Badge
            variant={life.remaining === 1 ? "secondary" : "outline"}
            className={cn("border-note-foreground/20", life.remaining === 1 && "bg-last-round text-last-round-foreground")}
          >
            {life.title}
          </Badge>
          <span className="tabular-nums">
            {life.cardLabel} · {life.until}
          </span>
          {card.discussed && (
            <span className="flex items-center gap-1 font-medium text-note-foreground">
              <CheckCircle2Icon className="size-3.5 text-emerald-700" aria-hidden />
              heute besprochen
            </span>
          )}
        </div>
        <DialogTitle className={cn("text-2xl leading-tight font-semibold tracking-tight", focusBy && "text-3xl")}>
          {card.title}
        </DialogTitle>
        <DialogDescription className="sr-only">Thema im Detail</DialogDescription>
      </DialogHeader>

      {card.description ? (
        <p
          className={cn("text-base leading-relaxed break-words whitespace-pre-line", focusBy && "text-lg")}
          data-testid="card-description"
        >
          {card.description}
        </p>
      ) : (
        <p className="text-sm text-note-muted italic">Keine Beschreibung.</p>
      )}

      <section className="grid gap-2" aria-label="Namen">
        <div className="flex flex-wrap items-center gap-2">
          {card.people.map((person) => (
            <PersonBadge key={person.id} name={person.name} userId={person.userId} onNote className="gap-1 pr-1">
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-foreground/10"
                aria-label={`${person.name} entfernen`}
                onClick={() => actions.removePerson.mutate({ cardId: card.id, personId: person.id })}
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            </PersonBadge>
          ))}
          <PeoplePicker
            participants={board.participants}
            people={card.people}
            onAdd={(person) => actions.addPerson.mutate({ cardId: card.id, ...person })}
          />
        </div>
        <p className="text-xs text-note-muted">
          angelegt von {card.createdBy.name} am {formatDateTime(card.createdAt)}
        </p>
      </section>

      <details className="group rounded-md border border-note-foreground/15 bg-white/40 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium select-none">Verlauf</summary>
        <div className="pt-3">
          <CardHistory slug={slug} cardId={card.id} />
        </div>
      </details>

      <DialogFooter className={cn(paperFooter, "items-center gap-3 sm:justify-between")}>
        {running ? (
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={card.discussed}
              onCheckedChange={(discussed) => actions.setDiscussed.mutate({ cardId: card.id, discussed })}
              aria-label="Besprochen"
            />
            Besprochen
          </label>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          {running &&
            (isFocus ? (
              <Button variant="outline" onClick={() => actions.unfocus.mutate(undefined)}>
                Fokus beenden
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  // Sofort abräumen: Das Live-Event kann vor der Antwort kommen und diese Ansicht aushängen.
                  onFocused?.();
                  actions.focus.mutate(card.id);
                }}
              >
                <MonitorUpIcon aria-hidden />
                Allen zeigen
              </Button>
            ))}
          <Button onClick={onEdit}>
            <PencilIcon aria-hidden />
            Bearbeiten
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function CardForm({
  slug,
  board,
  card,
  onColorChange,
  onCancel,
  onSaved,
  onDeleted,
}: {
  slug: string;
  board: BoardView;
  card: CardView | null;
  onColorChange: (color: CardColor) => void;
  onCancel: () => void;
  onSaved: (cardId: number) => void;
  onDeleted: () => void;
}) {
  const actions = useBoardActions(slug);
  // Stand beim Öffnen des Formulars: Weicht die Live-Karte davon ab, hat jemand anderes geändert.
  const [base, setBase] = useState(() => ({
    title: card?.title ?? "",
    description: card?.description ?? "",
    color: card?.color ?? "yellow",
  }));
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCardSchema),
    defaultValues: base,
  });
  const color = useWatch({ control: form.control, name: "color" }) ?? "yellow";
  useEffect(() => onColorChange(color), [color, onColorChange]);
  const audit = useCardAudit(slug, card?.id ?? null);
  const changedByOther =
    card !== null && (card.title !== base.title || card.description !== base.description || card.color !== base.color);
  const lastEditor = audit.data?.filter((e) => e.action === "card.updated").at(-1)?.actor.name ?? "Jemand";
  const focus = board.meeting.focus;
  const focusTitle = focus ? board.cards.find((c) => c.id === focus.cardId)?.title : null;

  const submit = form.handleSubmit(async (values) => {
    try {
      if (card) {
        await actions.updateCard.mutateAsync({ id: card.id, ...values });
        onSaved(card.id);
      } else {
        const created = await actions.createCard.mutateAsync(values);
        onSaved(created.id);
      }
    } catch {
      // Fehler zeigt die Mutation als Hinweis an.
    }
  });

  const takeOver = () => {
    if (!card) return;
    const next = { title: card.title, description: card.description, color: card.color };
    setBase(next);
    form.reset(next);
  };

  const remove = async () => {
    if (!card) return;
    await actions.deleteCard.mutateAsync(card.id);
    toast.success(`Thema „${card.title}“ gelöscht`);
    onDeleted();
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-xs font-medium tracking-wide text-note-muted uppercase">
          {card ? "Thema bearbeiten" : "Neues Thema"}
        </DialogTitle>
        <DialogDescription className="text-xs text-note-muted">
          {card ? `angelegt von ${card.createdBy.name}` : "Neue Themen landen in der Spalte „Neu“."}
        </DialogDescription>
      </DialogHeader>

      {changedByOther && (
        <Alert className="border-warning-foreground/20 bg-warning text-warning-foreground" data-testid="edit-conflict">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-warning-foreground">
            {lastEditor} hat dieses Thema gerade geändert.
            <Button type="button" size="sm" variant="outline" onClick={takeOver}>
              Neuen Stand übernehmen
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {focus && focusTitle && (
        <p className="text-sm text-note-muted" data-testid="focus-waiting">
          {focus.cardId === card?.id
            ? `${focus.by.name} zeigt gerade dieses Thema („${focusTitle}“) allen.`
            : `${focus.by.name} zeigt gerade „${focusTitle}“. Es öffnet sich, sobald du hier fertig bist.`}
        </p>
      )}

      {/* Geschrieben wird auf dem Papier selbst: randlose Felder, Beschriftung nur für Screenreader. */}
      <div className="grid gap-1">
        <Label htmlFor="card-title" className="sr-only">
          Titel
        </Label>
        <Input
          id="card-title"
          autoFocus
          placeholder="Titel"
          className={cn(paperField, "h-auto py-1 text-2xl leading-tight font-semibold tracking-tight md:text-2xl")}
          {...form.register("title")}
        />
        <FieldError message={form.formState.errors.title?.message} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="card-description" className="sr-only">
          Beschreibung (optional)
        </Label>
        <Textarea
          id="card-description"
          rows={7}
          placeholder="Worum geht es? (optional)"
          className={cn(paperField, "resize-none text-base leading-relaxed md:text-base")}
          {...form.register("description")}
        />
        <FieldError message={form.formState.errors.description?.message} />
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-xs font-medium tracking-wide text-note-muted uppercase">Farbe</legend>
        {/* Native Radios: Pfeiltasten und Screenreader funktionieren ohne Zusatzlogik. */}
        <div className="flex flex-wrap gap-2.5" data-testid="color-picker">
          {noteColors.map((color) => (
            <label key={color} className="relative cursor-pointer" title={noteColorNames[color]}>
              <input
                type="radio"
                value={color}
                aria-label={noteColorNames[color]}
                className="peer sr-only"
                {...form.register("color")}
              />
              <span
                className={cn(
                  "block size-8 rounded-full border border-note-foreground/15 shadow-xs transition-transform",
                  "peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-note-foreground peer-checked:ring-offset-2",
                  "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                )}
                style={{ backgroundColor: `var(--note-${color})` }}
                aria-hidden
              />
            </label>
          ))}
        </div>
      </fieldset>

      <DialogFooter className={cn(paperFooter, "sm:justify-between")}>
        {card ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2Icon aria-hidden />
                Löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Thema „{card.title}“ löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Das Thema verschwindet bei allen vom Board. Im Audit-Log bleibt nachvollziehbar, wer es gelöscht hat.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => void remove()}>
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {card ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
