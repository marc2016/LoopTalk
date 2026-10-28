import type { UserRef } from "@looptalk/shared";
import { PersonAvatar } from "@/components/person";
import { AvatarGroup } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Wer das Board gerade geöffnet hat. */
export function PresenceBar({ users, connected }: { users: UserRef[]; connected: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-label="Gerade auf dem Board">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span
          className={`size-2 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
          aria-hidden
        />
        {connected ? "Gerade da" : "Verbinde …"}
      </span>
      <AvatarGroup>
        {users.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <PersonAvatar
                name={user.name}
                userId={user.id}
                className="ring-2 ring-card"
                data-testid="presence-user"
                aria-label={user.name}
              />
            </TooltipTrigger>
            <TooltipContent>{user.name}</TooltipContent>
          </Tooltip>
        ))}
      </AvatarGroup>
      <span className="sr-only">{users.map((u) => u.name).join(", ")}</span>
    </div>
  );
}
