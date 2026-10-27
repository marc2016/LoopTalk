import { zodResolver } from "@hookform/resolvers/zod";
import { renameBoardSchema, type CreateBoardInput } from "@looptalk/shared";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoardActions } from "@/lib/queries";

export function RenameBoardDialog({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const { rename } = useBoardActions(slug);
  const form = useForm<CreateBoardInput>({ resolver: zodResolver(renameBoardSchema), values: { name } });

  const submit = form.handleSubmit(async (values) => {
    try {
      await rename.mutateAsync(values.name);
      setOpen(false);
    } catch (err) {
      form.setError("name", { message: (err as Error).message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Board umbenennen">
          <PencilIcon aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Board umbenennen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rename-board">Name</Label>
            <Input id="rename-board" autoFocus {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
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
