import type { CardPerson, Participant } from "@looptalk/shared";
import { UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Namen an ein Thema hängen: Vorschläge aus den Teilnehmern, freie Eingabe möglich. */
export function PeoplePicker({
  participants,
  people,
  onAdd,
}: {
  participants: Participant[];
  people: CardPerson[];
  onAdd: (person: { name: string; userId?: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const taken = new Set(people.map((p) => p.name.toLowerCase()));
  const suggestions = participants.filter((p) => p.active && !taken.has(p.name.toLowerCase()));
  const typed = search.trim();
  const canAddTyped = typed.length > 0 && !taken.has(typed.toLowerCase()) && !suggestions.some((p) => p.name.toLowerCase() === typed.toLowerCase());

  const add = (person: { name: string; userId?: number }) => {
    onAdd(person);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <UserPlusIcon aria-hidden />
          Name hinzufügen
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Name eingeben …" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{typed ? "Kein Teilnehmer gefunden." : "Alle Teilnehmer stehen schon dran."}</CommandEmpty>
            {canAddTyped && (
              <CommandGroup>
                <CommandItem value={`__neu__${typed}`} onSelect={() => add({ name: typed })}>
                  „{typed}“ hinzufügen
                </CommandItem>
              </CommandGroup>
            )}
            {suggestions.length > 0 && (
              <CommandGroup heading="Teilnehmer">
                {suggestions.map((p) => (
                  <CommandItem key={p.id} value={p.name} onSelect={() => add({ name: p.name, userId: p.id })}>
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
