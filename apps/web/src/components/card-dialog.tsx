import { zodResolver } from "@hookform/resolvers/zod";
import { type BoardView, type CardView, createCardSchema } from "@looptalk/shared";
import { Trash2Icon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { CardHistory } from "@/components/card-history";
import { FieldError } from "@/components/field-error";
import { PeoplePicker } from "@/components/people-picker";
import { PersonBadge } from "@/components/person";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { columnTitle } from "@/lib/lifecycle";
import { useBoardActions } from "@/lib/queries";

type FormInput = z.input<typeof createCardSchema>;
type FormOutput = z.output<typeof createCardSchema>;

/** `card === null`: neues Thema anlegen. Sonst bearbeiten, Namen pflegen, löschen, Verlauf. */
export function CardDialog({
  slug,
  board,
  card,
  open,
  onOpenChange,
}: {
  slug: string;
  board: BoardView;
  card: CardView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const actions = useBoardActions(slug);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCardSchema),
    values: { title: card?.title ?? "", description: card?.description ?? "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      if (card) {
        await actions.updateCard.mutateAsync({ id: card.id, ...values });
      } else {
        await actions.createCard.mutateAsync(values);
        form.reset({ title: "", description: "" });
      }
      onOpenChange(false);
    } catch {
      // Fehler zeigt die Mutation als Hinweis an.
    }
  });

  const remove = async () => {
    if (!card) return;
    await actions.deleteCard.mutateAsync(card.id);
    toast.success(`Thema „${card.title}“ gelöscht`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form id="card-form" onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{card ? "Thema bearbeiten" : "Neues Thema"}</DialogTitle>
            <DialogDescription>
              {card
                ? `${columnTitle(card.column)} · angelegt von ${card.createdBy.name} am ${formatDateTime(card.createdAt)}`
                : "Neue Themen landen in der Spalte „Neu“."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="card-title">Titel</Label>
            <Input id="card-title" autoFocus {...form.register("title")} />
            <FieldError message={form.formState.errors.title?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="card-description">Beschreibung (optional)</Label>
            <Textarea id="card-description" rows={4} {...form.register("description")} />
            <FieldError message={form.formState.errors.description?.message} />
          </div>

        </form>

        {card && (
          <>
            <Separator />
            <section className="grid gap-3" aria-label="Namen">
              <h3 className="text-sm font-medium">Namen</h3>
              <div className="flex flex-wrap items-center gap-2">
                {card.people.map((person) => (
                  <PersonBadge key={person.id} name={person.name} userId={person.userId} className="gap-1 pr-1">
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
            </section>
            <Separator />
            <section className="grid gap-3">
              <h3 className="text-sm font-medium">Verlauf</h3>
              <CardHistory slug={slug} cardId={card.id} />
            </section>
          </>
        )}

        <DialogFooter className="sm:justify-between">
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
          <Button type="submit" form="card-form" disabled={form.formState.isSubmitting}>
            {card ? "Speichern" : "Anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
