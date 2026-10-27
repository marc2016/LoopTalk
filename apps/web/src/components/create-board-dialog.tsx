import { zodResolver } from "@hookform/resolvers/zod";
import { createBoardSchema, type CreateBoardInput } from "@looptalk/shared";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBoard } from "@/lib/queries";

export function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const create = useCreateBoard();
  const form = useForm<CreateBoardInput>({ resolver: zodResolver(createBoardSchema), defaultValues: { name: "" } });

  const submit = form.handleSubmit(async ({ name }) => {
    try {
      const board = await create.mutateAsync(name);
      setOpen(false);
      form.reset();
      navigate(`/b/${board.slug}`);
    } catch (err) {
      form.setError("name", { message: (err as Error).message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden />
          Board erstellen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Neues Board</DialogTitle>
            <DialogDescription>Danach kannst du den Link teilen. Wer ihn öffnet, macht mit.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="board-name">Name</Label>
            <Input id="board-name" placeholder="z. B. Team-Austausch" autoFocus {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
