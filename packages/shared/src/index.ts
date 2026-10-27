import { z } from "zod";

/** Ab dieser Anzahl aktiver Teilnehmer ist eine Rotation möglich. */
export const MIN_ACTIVE_PARTICIPANTS = 2;

// ---------------------------------------------------------------------------
// Request-Schemas
// ---------------------------------------------------------------------------

const id = z.number().int().positive();

export const boardNameSchema = z
  .string()
  .trim()
  .min(1, "Bitte einen Namen angeben.")
  .max(100, "Der Name darf höchstens 100 Zeichen lang sein.");

export const createBoardSchema = z.strictObject({ name: boardNameSchema });
export const renameBoardSchema = createBoardSchema;

const cardTitleSchema = z
  .string()
  .trim()
  .min(1, "Bitte einen Titel angeben.")
  .max(200, "Der Titel darf höchstens 200 Zeichen lang sein.");
const cardDescriptionSchema = z
  .string()
  .trim()
  .max(5000, "Die Beschreibung darf höchstens 5000 Zeichen lang sein.");

export const createCardSchema = z.strictObject({
  title: cardTitleSchema,
  description: cardDescriptionSchema.default(""),
});

/** Die Spalte ist bewusst nicht enthalten: Karten werden nie manuell verschoben. */
export const updateCardSchema = z
  .strictObject({
    title: cardTitleSchema.optional(),
    description: cardDescriptionSchema.optional(),
  })
  .refine((v) => v.title !== undefined || v.description !== undefined, {
    message: "Keine Änderung angegeben.",
  });

export const addPersonSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Bitte einen Namen angeben.")
    .max(100, "Der Name darf höchstens 100 Zeichen lang sein."),
  userId: id.optional(),
});

export const meetingVersionSchema = z.strictObject({
  version: z.number().int().nonnegative(),
});

export const setRolesSchema = z.strictObject({
  moderatorId: id,
  protocolId: id.nullable(),
  version: z.number().int().nonnegative(),
});

export const setParticipantSchema = z.strictObject({ active: z.boolean() });

export const auditActions = [
  "board.created",
  "board.renamed",
  "member.joined",
  "member.activated",
  "member.deactivated",
  "card.created",
  "card.updated",
  "card.deleted",
  "card.person_added",
  "card.person_removed",
  "meeting.started",
  "meeting.roles_changed",
  "meeting.ended",
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditQuerySchema = z.object({
  before: z.coerce.number().int().positive().optional(),
  actor: z.coerce.number().int().positive().optional(),
  action: z.enum(auditActions).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type CreateCardInput = z.input<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type AddPersonInput = z.infer<typeof addPersonSchema>;
export type SetRolesInput = z.infer<typeof setRolesSchema>;
export type AuditQuery = z.infer<typeof auditQuerySchema>;

// ---------------------------------------------------------------------------
// Antworten
// ---------------------------------------------------------------------------

export type Column = 1 | 2 | 3;
export type MeetingStatus = "planned" | "running" | "ended";

export interface UserRef {
  id: number;
  name: string;
}

export interface Me extends UserRef {
  email: string | null;
}

export interface BoardSummary {
  slug: string;
  name: string;
  createdAt: string;
}

export interface CardPerson {
  id: number;
  name: string;
  userId: number | null;
}

export interface CardView {
  id: number;
  title: string;
  description: string;
  column: Column;
  createdBy: UserRef;
  createdAt: string;
  people: CardPerson[];
}

export interface CurrentMeeting {
  number: number;
  status: Exclude<MeetingStatus, "ended">;
  startedAt: string | null;
  moderator: UserRef;
  protocol: UserRef | null;
  version: number;
}

export interface Participant extends UserRef {
  active: boolean;
  joinedAt: string;
}

export interface BoardView {
  slug: string;
  name: string;
  meeting: CurrentMeeting;
  cards: CardView[];
  participants: Participant[];
  tooFewParticipants: boolean;
}

export interface MeetingCardSnapshot {
  cardId: number;
  title: string;
  description: string;
  column: Column;
  people: string[];
}

export interface MeetingHistoryEntry {
  id: number;
  number: number;
  startedAt: string;
  endedAt: string;
  moderator: UserRef;
  protocol: UserRef | null;
  cards: MeetingCardSnapshot[];
}

export interface AuditEntry {
  id: number;
  at: string;
  actor: UserRef;
  action: AuditAction;
  targetType: "board" | "member" | "card" | "meeting";
  targetId: number;
  data: Record<string, unknown>;
}

export interface AuditPage {
  entries: AuditEntry[];
  nextCursor: number | null;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

// ---------------------------------------------------------------------------
// Server-Sent Events
// ---------------------------------------------------------------------------

/** `board`: Board, Rollen oder Teilnehmer haben sich geändert, Client lädt neu. */
export interface BoardChangedEvent {
  reason: AuditAction;
}

/** `presence`: wer das Board gerade geöffnet hat. */
export interface PresenceEvent {
  users: UserRef[];
}
