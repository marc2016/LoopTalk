import { zodResolver } from "@hookform/resolvers/zod";
import { type BoardView, type CardColor, type CardView, createCardSchema, type UserRef } from "@looptalk/shared";
import { CheckCircle2Icon, MonitorUpIcon, Trash2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { CardHistory } from "@/components/card-history";
import { ColorPicker } from "@/components/color-picker";
import { FieldError } from "@/components/field-error";
import { InlineField, paperField } from "@/components/inline-field";
import { PeoplePicker } from "@/components/people-picker";
import { PersonAvatar, PersonBadge } from "@/components/person";
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
import type { InlineFieldName } from "@/lib/inline-edit";
import { lifecycle } from "@/lib/lifecycle";
import { noteAge } from "@/lib/note";
import { useBoardActions, useCardAudit } from "@/lib/queries";
import { useGrowFromCard } from "@/lib/use-grow-from-card";
import { cn } from "@/lib/utils";

/** Bestehende Karten haben keinen Modus mehr: Bearbeitet wird direkt auf dem Zettel. */
export type SheetMode = "view" | "create";

/** Footer liegt auf dem Papier: ohne eigene Fläche, Rand und überstehende Ränder des Dialogs. */
const paperFooter = "mx-0 mt-auto mb-0 rounded-none border-0 bg-transparent p-0 pt-2";

type FormInput = z.input<typeof createCardSchema>;
type FormOutput = z.output<typeof createCardSchema>;

/**
 * Großer Zettel: wächst aus dem kleinen Zettel auf dem Board. Lesen und Bearbeiten direkt
 * auf dem Papier, Anlegen eines neuen Themas. Mit `focusBy` ist er die gemeinsame Fokusansicht.
 */
export function CardSheet({
  slug,
  board,
  card,
  mode,
  focusBy = null,
  onBusyChange,
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
  /** Wird gerade ein Feld bearbeitet? Dann soll der gemeinsame Fokus nicht dazwischenfunken. */
  onBusyChange?: (busy: boolean) => void;
  onCreated: (cardId: number) => void;
  /** Ich habe die Karte allen gezeigt: Die Fokusansicht übernimmt. */
  onFocused?: () => void;
  onClose: () => void;
}) {
  const { attach, close } = useGrowFromCard(card?.id ?? null);
  const requestClose = () => close(onClose);
  // Beim Anlegen färbt die gewählte Farbe das Papier sofort um, gespeichert wird mit „Anlegen“.
  const [draftColor, setDraftColor] = useState<CardColor>("yellow");
  // Direkt gewählte Farbe, bis der Live-Stand sie hat; `from` ist die Farbe beim Klick.
  const [pendingColor, setPendingColor] = useState<{ color: CardColor; from: CardColor } | null>(null);
  const liveColor = card?.color ?? "yellow";
  const paperColor =
    mode === "create" ? draftColor : pendingColor && pendingColor.from === liveColor ? pendingColor.color : liveColor;

  // Welche Felder gerade bearbeitet werden. Der Ref ist für Escape synchron aktuell.
  const editingFields = useRef(new Set<InlineFieldName>());
  const latestBusy = useRef(onBusyChange);
  useEffect(() => {
    latestBusy.current = onBusyChange;
  });
  const onEditingChange = useCallback((field: InlineFieldName, editing: boolean) => {
    const fields = editingFields.current;
    const before = fields.size > 0;
    if (editing) fields.add(field);
    else fields.delete(field);
    const after = fields.size > 0;
    if (before !== after) latestBusy.current?.(after);
  }, []);

  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <DialogContent
        ref={attach}
        data-card-sheet={focusBy ? "focus" : "personal"}
        data-color={paperColor}
        data-age={card ? noteAge(card.column) : 3}
        // Escape in einem Feld verwirft nur die Eingabe, der Zettel bleibt offen.
        onEscapeKeyDown={(e) => editingFields.current.size > 0 && e.preventDefault()}
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
            color={paperColor}
            focusBy={focusBy}
            onColorChange={(color) => setPendingColor({ color, from: liveColor })}
            onColorFailed={() => setPendingColor(null)}
            onEditingChange={onEditingChange}
            onFocused={onFocused}
            onDeleted={onClose}
          />
        ) : (
          <CreateCardForm
            slug={slug}
            board={board}
            onColorChange={setDraftColor}
            onCancel={requestClose}
            onCreated={onCreated}
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
  color,
  focusBy,
  onColorChange,
  onColorFailed,
  onEditingChange,
  onFocused,
  onDeleted,
}: {
  slug: string;
  board: BoardView;
  card: CardView;
  /** Farbe, die der Zettel gerade zeigt (auch eine eben gewählte, noch nicht bestätigte). */
  color: CardColor;
  focusBy: UserRef | null;
  onColorChange: (color: CardColor) => void;
  onColorFailed: () => void;
  onEditingChange: (field: InlineFieldName, editing: boolean) => void;
  onFocused?: () => void;
  onDeleted: () => void;
}) {
  const actions = useBoardActions(slug);
  const audit = useCardAudit(slug, card.id);
  const lastEditor = audit.data?.filter((e) => e.action === "card.updated").at(-1)?.actor.name ?? "Jemand";
  const { meeting } = board;
  const running = meeting.status === "running";
  const life = lifecycle(card.column, meeting.number);
  const isFocus = meeting.focus?.cardId === card.id;

  const changeColor = (next: CardColor) => {
    if (next === color) return;
    onColorChange(next);
    actions.updateCard.mutate({ id: card.id, color: next }, { onError: onColorFailed });
  };

  const remove = async () => {
    await actions.deleteCard.mutateAsync(card.id);
    toast.success(`Thema „${card.title}“ gelöscht`);
    onDeleted();
  };

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
        {/* Als div mit Überschrift-Rolle: Beim Bearbeiten stehen Feld und Hinweis darin. */}
        <DialogTitle asChild>
          <div role="heading" aria-level={2}>
            <InlineField
            slug={slug}
            cardId={card.id}
            field="title"
            value={card.title}
            lastEditor={lastEditor}
            className={cn("text-2xl leading-tight font-semibold tracking-tight md:text-2xl", focusBy && "text-3xl md:text-3xl")}
            onEditingChange={onEditingChange}
            />
          </div>
        </DialogTitle>
        <DialogDescription className="sr-only">Thema im Detail, direkt bearbeitbar</DialogDescription>
      </DialogHeader>

      <InlineField
        slug={slug}
        cardId={card.id}
        field="description"
        value={card.description}
        lastEditor={lastEditor}
        placeholder="Beschreibung ergänzen …"
        testId="card-description"
        className={cn("text-base leading-relaxed md:text-base", focusBy && "text-lg md:text-lg")}
        onEditingChange={onEditingChange}
      />

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

      <ColorPicker value={color} onChange={changeColor} />

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
        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Löschen"
                title="Löschen"
                className="text-note-muted hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon aria-hidden />
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
        </div>
      </DialogFooter>
    </>
  );
}

/** Neues Thema: Die Karte gibt es noch nicht, deshalb ein Formular mit „Anlegen“. */
function CreateCardForm({
  slug,
  board,
  onColorChange,
  onCancel,
  onCreated,
}: {
  slug: string;
  board: BoardView;
  onColorChange: (color: CardColor) => void;
  onCancel: () => void;
  onCreated: (cardId: number) => void;
}) {
  const actions = useBoardActions(slug);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCardSchema),
    defaultValues: { title: "", description: "", color: "yellow" },
  });
  const color = useWatch({ control: form.control, name: "color" }) ?? "yellow";
  useEffect(() => onColorChange(color), [color, onColorChange]);
  const focus = board.meeting.focus;
  const focusTitle = focus ? board.cards.find((c) => c.id === focus.cardId)?.title : null;

  const submit = form.handleSubmit(async (values) => {
    try {
      const created = await actions.createCard.mutateAsync(values);
      onCreated(created.id);
    } catch {
      // Fehler zeigt die Mutation als Hinweis an.
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-xs font-medium tracking-wide text-note-muted uppercase">Neues Thema</DialogTitle>
        <DialogDescription className="text-xs text-note-muted">Neue Themen landen in der Spalte „Neu“.</DialogDescription>
      </DialogHeader>

      {focus && focusTitle && (
        <p className="text-sm text-note-muted" data-testid="focus-waiting">
          {`${focus.by.name} zeigt gerade „${focusTitle}“. Es öffnet sich, sobald du hier fertig bist.`}
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
      <Controller
        control={form.control}
        name="color"
        render={({ field }) => <ColorPicker value={field.value ?? "yellow"} onChange={field.onChange} />}
      />

      <DialogFooter className={cn(paperFooter, "sm:justify-end")}>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Anlegen
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
