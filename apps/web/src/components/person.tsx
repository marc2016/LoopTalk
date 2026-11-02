import type { ComponentProps, ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import { personColor } from "@/lib/person";
import { cn } from "@/lib/utils";

/** Avatar in der festen Farbe der Person; ohne `userId` neutral. */
export function PersonAvatar({
  name,
  userId,
  size = "sm",
  className,
  ...props
}: { name: string; userId: number | null } & Omit<ComponentProps<typeof Avatar>, "children">) {
  const color = userId === null ? null : personColor(userId);
  return (
    <Avatar size={size} className={className} {...props}>
      <AvatarFallback
        className={cn("font-medium", !color && "bg-secondary text-secondary-foreground")}
        style={color ? { backgroundColor: color.bg, color: color.fg } : undefined}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * Name als Badge in der Farbe der Person; frei eingegebene Namen ohne Konto neutral.
 * Auf Zetteln (`onNote`) weiß mit Farbpunkt, damit der Name auf jeder Zettelfarbe lesbar bleibt.
 */
export function PersonBadge({
  name,
  userId,
  onNote = false,
  className,
  children,
}: {
  name: string;
  userId: number | null;
  onNote?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const color = userId === null ? null : personColor(userId);
  if (onNote) {
    return (
      <Badge
        variant="secondary"
        className={cn("bg-white/90 text-note-foreground shadow-xs", className)}
        data-person={userId === null ? "free" : "member"}
      >
        {color && (
          <span
            className="size-2 shrink-0 rounded-full ring-1 ring-note-foreground/25"
            style={{ backgroundColor: color.fg }}
            data-testid="person-dot"
            aria-hidden
          />
        )}
        {name}
        {children}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn(!color && "bg-muted text-foreground", className)}
      style={color ? { backgroundColor: color.bg, color: color.fg } : undefined}
      data-person={userId === null ? "free" : "member"}
    >
      {name}
      {children}
    </Badge>
  );
}
