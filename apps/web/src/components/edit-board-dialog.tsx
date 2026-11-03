import { zodResolver } from "@hookform/resolvers/zod";
import { boardNameSchema, boardWallSchema, type BoardWall, type UpdateBoardInput } from "@looptalk/shared";
import { PencilIcon } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoardActions } from "@/lib/queries";
import { wallNames, walls } from "@/lib/wall";
import { cn } from "@/lib/utils";

const formSchema = z.object({ name: boardNameSchema, wall: boardWallSchema });
type FormValues = z.infer<typeof formSchema>;

/** Name und Wand des Boards ändern; gesendet wird nur, was sich geändert hat. */
export function EditBoardDialog({ slug, name, wall }: { slug: string; name: string; wall: BoardWall }) {
  const [open, setOpen] = useState(false);
  const { updateBoard } = useBoardActions(slug);
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), values: { name, wall } });

  const submit = form.handleSubmit(async (values) => {
    const input: UpdateBoardInput = {
      ...(values.name !== name && { name: values.name }),
      ...(values.wall !== wall && { wall: values.wall }),
    };
    if (Object.keys(input).length === 0) {
      setOpen(false);
      return;
    }
    try {
      await updateBoard.mutateAsync(input);
      setOpen(false);
    } catch (err) {
      form.setError("name", { message: (err as Error).message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Board bearbeiten">
          <PencilIcon aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Board bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="edit-board-name">Name</Label>
            <Input id="edit-board-name" autoFocus {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <Controller
            control={form.control}
            name="wall"
            render={({ field }) => <WallPicker value={field.value} onChange={field.onChange} />}
          />
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Kleine Ecke für die Mini-Zettel der Vorschau. */
const mini = { "--curl-rest": "4px" } as CSSProperties;

/** Drei Kacheln mit Vorschau der Wand. Native Radios: Pfeiltasten und Screenreader ohne Zusatzlogik. */
function WallPicker({ value, onChange }: { value: BoardWall; onChange: (wall: BoardWall) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Wand</legend>
      <div className="grid grid-cols-3 gap-2" data-testid="wall-picker">
        {walls.map((wall) => (
          <label key={wall} className="relative cursor-pointer" title={wallNames[wall]}>
            <input
              type="radio"
              name="board-wall"
              value={wall}
              checked={value === wall}
              onChange={() => onChange(wall)}
              aria-label={wallNames[wall]}
              className="peer sr-only"
            />
            <span
              className={cn(
                "grid gap-1.5 rounded-lg border p-1.5 text-center text-xs transition-colors",
                "peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/30",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
              )}
              aria-hidden
            >
              {/* Kleine Wand mit zwei Zetteln */}
              <span className="wall flex h-11 items-end justify-center gap-1 rounded-md p-1.5" data-wall={wall}>
                <span className="note-paper relative h-5 w-5 -rotate-2" data-color="yellow" style={mini} />
                <span className="note-paper relative h-5 w-5 rotate-1" data-color="blue" style={mini} />
              </span>
              {wallNames[wall]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
