import type { UserRef } from "@looptalk/shared";
import { MonitorUpIcon } from "lucide-react";
import { PersonAvatar } from "@/components/person";
import { Button } from "@/components/ui/button";

/** Leiste für den gemeinsamen Fokus, wenn die Fokusansicht gerade nicht offen ist. */
export function FocusBar({
  by,
  title,
  busy,
  onShow,
  onEnd,
}: {
  by: UserRef;
  title: string;
  /** Ich bin gerade beschäftigt (Bearbeiten, anderer Dialog): „Ansehen“ statt „Zurück zum Fokus“. */
  busy: boolean;
  onShow: () => void;
  onEnd: () => void;
}) {
  return (
    <div
      role="status"
      data-testid="focus-bar"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-primary/25 bg-running px-4 py-2.5 text-sm animate-in fade-in-0"
    >
      <MonitorUpIcon className="size-4 text-primary" aria-hidden />
      <span className="flex min-w-0 items-center gap-2">
        <PersonAvatar name={by.name} userId={by.id} className="size-5" aria-hidden />
        <span className="truncate">
          <span className="font-medium">{by.name} zeigt:</span> {title}
        </span>
      </span>
      <div className="ml-auto flex gap-2">
        <Button size="sm" onClick={onShow}>
          {busy ? "Ansehen" : "Zurück zum Fokus"}
        </Button>
        <Button size="sm" variant="outline" onClick={onEnd}>
          Fokus beenden
        </Button>
      </div>
    </div>
  );
}
