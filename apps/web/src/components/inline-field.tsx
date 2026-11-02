import { useQueryClient } from "@tanstack/react-query";
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { commitField, type InlineFieldName } from "@/lib/inline-edit";
import { keys, useBoardActions } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Eingabefeld, das wie Schrift auf dem Zettel wirkt: transparent, nur eine gestrichelte Linie. */
export const paperField =
  "rounded-none border-0 border-b border-dashed border-note-foreground/25 bg-transparent px-0 text-note-foreground shadow-none placeholder:text-note-muted/70 focus-visible:border-solid focus-visible:border-note-foreground focus-visible:ring-0";

const labels: Record<InlineFieldName, string> = { title: "Titel", description: "Beschreibung" };

type Editing = { base: string; value: string; error: string | null };

/**
 * Titel oder Beschreibung direkt auf dem Zettel: sieht aus wie Schrift, wird per Klick zum
 * Feld. Enter (Titel), Strg/Cmd+Enter (Beschreibung) und Verlassen speichern, Escape verwirft.
 */
export function InlineField({
  slug,
  cardId,
  field,
  value,
  lastEditor,
  placeholder,
  className,
  testId,
  onEditingChange,
}: {
  slug: string;
  cardId: number;
  field: InlineFieldName;
  /** Live-Stand des Felds. */
  value: string;
  /** Wer die Karte zuletzt geändert hat, für den Konflikthinweis. */
  lastEditor: string;
  /** Text der Anzeige, wenn das Feld leer ist. */
  placeholder?: string;
  /** Schrift von Anzeige und Feld, damit beim Umschalten nichts springt. */
  className?: string;
  testId?: string;
  onEditingChange: (field: InlineFieldName, editing: boolean) => void;
}) {
  const actions = useBoardActions(slug);
  const queryClient = useQueryClient();
  const [editing, setEditingState] = useState<Editing | null>(null);
  // Gespeicherter Wert, bis der Live-Stand ihn hat; `from` ist der Live-Wert beim Speichern.
  const [saved, setSaved] = useState<{ value: string; from: string } | null>(null);
  const shown = saved && saved.from === value ? saved.value : value;
  const multiline = field === "description";
  const label = labels[field];

  // Spiegel für Tastatur-Handler und Aushängen: immer der neueste Stand, synchron gesetzt.
  const editingRef = useRef<Editing | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const setEditing = (next: Editing | null) => {
    editingRef.current = next;
    setEditingState(next);
  };
  const latest = useRef({ slug, cardId, field, onEditingChange, queryClient });
  useLayoutEffect(() => {
    latest.current = { slug, cardId, field, onEditingChange, queryClient };
  });

  const isEditing = editing !== null;
  useEffect(() => {
    onEditingChange(field, isEditing);
  }, [field, isEditing, onEditingChange]);

  // Zettel schließt oder Fokus wechselt, während noch etwas im Feld steht: trotzdem speichern.
  useEffect(
    () => () => {
      const pending = editingRef.current;
      const { slug, cardId, field, onEditingChange, queryClient } = latest.current;
      onEditingChange(field, false);
      if (!pending) return;
      const result = commitField(field, pending.base, pending.value);
      if (result.kind !== "save") return;
      // Ohne Fehler-Hinweis: Ist die Karte inzwischen weg, schließt die Ansicht ohnehin mit Hinweis.
      void api(`/boards/${slug}/cards/${cardId}`, { method: "PATCH", body: { [field]: result.value } })
        .catch(() => undefined)
        .finally(() => void queryClient.invalidateQueries({ queryKey: keys.board(slug) }));
    },
    [],
  );

  const start = () => setEditing({ base: shown, value: shown, error: null });

  const commit = () => {
    const current = editingRef.current;
    if (!current) return;
    const result = commitField(field, current.base, current.value);
    if (result.kind === "error") {
      setEditing({ ...current, error: result.message });
      return;
    }
    setEditing(null);
    if (result.kind === "skip") return;
    const from = value;
    setSaved({ value: result.value, from });
    const input = field === "title" ? { title: result.value } : { description: result.value };
    actions.updateCard.mutate({ id: cardId, ...input }, { onError: () => setSaved(null) });
  };

  if (!editing) {
    const empty = shown.trim() === "";
    return (
      <button
        type="button"
        onClick={start}
        data-testid={testId}
        className={cn(
          "-mx-1 block w-[calc(100%+0.5rem)] cursor-text rounded-sm px-1 text-left break-words whitespace-pre-line select-text",
          "hover:bg-white/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          className,
          empty && "text-note-muted italic",
        )}
      >
        <span className="sr-only">{label} bearbeiten: </span>
        {empty ? placeholder : shown}
      </button>
    );
  }

  // Gegen den angezeigten Stand vergleichen: Die eigene, noch nicht live bestätigte Speicherung ist kein Konflikt.
  const conflict = editing.base !== shown;
  const inputProps = {
    id: `card-${field}`,
    ref: inputRef,
    autoFocus: true,
    "aria-label": label,
    "aria-invalid": editing.error !== null,
    value: editing.value,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditing({ ...editing, value: e.target.value, error: null }),
    onFocus: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Cursor ans Ende, wie beim Weiterschreiben auf Papier.
      const end = e.target.value.length;
      e.target.setSelectionRange(end, end);
    },
    onBlur: (e: FocusEvent) => {
      // Fenster- oder Tab-Wechsel: Eingabe bleibt offen, nichts wird gespeichert.
      if (!document.hasFocus()) return;
      // Per Tab zum Konflikthinweis: noch nicht speichern, dort kann man den neuen Stand übernehmen.
      if (e.relatedTarget instanceof Node && conflictRef.current?.contains(e.relatedTarget)) return;
      commit();
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEditing(null);
      } else if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commit();
      }
    },
  };

  return (
    <div className="grid gap-1">
      {multiline ? (
        <Textarea rows={7} {...inputProps} className={cn(paperField, "resize-none", className)} />
      ) : (
        <Input {...inputProps} className={cn(paperField, "h-auto py-1", className)} />
      )}
      <FieldError message={editing.error ?? undefined} />
      {conflict && (
        <Alert
          ref={conflictRef}
          className="border-warning-foreground/20 bg-warning text-warning-foreground"
          data-testid="edit-conflict"
        >
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-warning-foreground">
            {lastEditor} hat dieses Thema gerade geändert.
            <Button
              type="button"
              size="sm"
              variant="outline"
              // Nicht vorher das Feld verlassen und damit die eigene Eingabe speichern.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setEditing({ base: shown, value: shown, error: null });
                inputRef.current?.focus();
              }}
            >
              Neuen Stand übernehmen
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
