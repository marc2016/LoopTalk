import type { CardColor } from "@looptalk/shared";
import { noteColorNames, noteColors } from "@/lib/note";
import { cn } from "@/lib/utils";

/**
 * Farbwahl für Zettel. Native Radios: Pfeiltasten und Screenreader funktionieren ohne
 * Zusatzlogik. Ein Klick auf die bereits gewählte Farbe löst kein `onChange` aus.
 */
export function ColorPicker({ value, onChange }: { value: CardColor; onChange: (color: CardColor) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-xs font-medium tracking-wide text-note-muted uppercase">Farbe</legend>
      <div className="flex flex-wrap gap-2.5" data-testid="color-picker">
        {noteColors.map((color) => (
          <label key={color} className="relative cursor-pointer" title={noteColorNames[color]}>
            <input
              type="radio"
              name="card-color"
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              aria-label={noteColorNames[color]}
              className="peer sr-only"
            />
            <span
              className={cn(
                "block size-8 rounded-full border border-note-foreground/15 shadow-xs transition-transform",
                "peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-note-foreground peer-checked:ring-offset-2",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
              )}
              style={{ backgroundColor: `var(--note-${color})` }}
              aria-hidden
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
