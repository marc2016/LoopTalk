import type { UserRef } from "@looptalk/shared";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { initials } from "@/lib/format";

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
              <Avatar size="sm" className="ring-2 ring-card" data-testid="presence-user" aria-label={user.name}>
                <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(user.name)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{user.name}</TooltipContent>
          </Tooltip>
        ))}
      </AvatarGroup>
      <span className="sr-only">{users.map((u) => u.name).join(", ")}</span>
    </div>
  );
}
