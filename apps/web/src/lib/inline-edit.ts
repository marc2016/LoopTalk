import { cardDescriptionSchema, cardTitleSchema } from "@looptalk/shared";

export type InlineFieldName = "title" | "description";

export type CommitResult = { kind: "skip" } | { kind: "error"; message: string } | { kind: "save"; value: string };

const schemas = { title: cardTitleSchema, description: cardDescriptionSchema } as const;

/**
 * Entscheidet, was beim Verlassen eines Inline-Felds passiert: nichts (unverändert),
 * Fehler (ungültig, nach denselben Regeln wie der Server) oder Speichern.
 */
export function commitField(field: InlineFieldName, base: string, value: string): CommitResult {
  const parsed = schemas[field].safeParse(value);
  if (!parsed.success) return { kind: "error", message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  if (parsed.data === base.trim()) return { kind: "skip" };
  return { kind: "save", value: parsed.data };
}
