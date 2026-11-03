import {
  type AuditAction,
  type AuditEntry,
  BOARD_WALLS,
  type BoardWall,
  CARD_COLORS,
  type CardColor,
  type MeetingStatus,
} from "@looptalk/shared";
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const cardColor = () => text().$type<CardColor>().notNull().default("yellow");
const cardColorCheck = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} IN (${sql.raw(CARD_COLORS.map((c) => `'${c}'`).join(", "))})`);
const id = () => bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity();
const ref = (name: string) => bigint(name, { mode: "number" });
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: id(),
  oidcSub: text().notNull().unique(),
  name: text().notNull(),
  email: text(),
  createdAt: createdAt(),
});

export const boards = pgTable(
  "boards",
  {
    id: id(),
    slug: varchar({ length: 32 }).notNull().unique(),
    name: text().notNull(),
    wall: text().$type<BoardWall>().notNull().default("paper"),
    createdBy: ref("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [check("boards_wall_check", sql`${t.wall} IN (${sql.raw(BOARD_WALLS.map((w) => `'${w}'`).join(", "))})`)],
);

export const boardMembers = pgTable(
  "board_members",
  {
    boardId: ref("board_id")
      .notNull()
      .references(() => boards.id),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id),
    active: boolean().notNull().default(true),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.boardId, t.userId] }), index("board_members_user_idx").on(t.userId)],
);

export const cards = pgTable(
  "cards",
  {
    id: id(),
    boardId: ref("board_id")
      .notNull()
      .references(() => boards.id),
    title: text().notNull(),
    description: text().notNull().default(""),
    color: cardColor(),
    column: smallint().notNull().default(1),
    createdBy: ref("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
    deletedAt: timestamp({ withTimezone: true }),
    archivedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    check("cards_column_check", sql`${t.column} BETWEEN 1 AND 3`),
    cardColorCheck("cards_color_check", t.color),
    index("cards_board_open_idx")
      .on(t.boardId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.archivedAt} IS NULL`),
  ],
);

export const cardPeople = pgTable(
  "card_people",
  {
    id: id(),
    cardId: ref("card_id")
      .notNull()
      .references(() => cards.id),
    name: text().notNull(),
    userId: ref("user_id").references(() => users.id),
    addedBy: ref("added_by")
      .notNull()
      .references(() => users.id),
    addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("card_people_card_name_idx").on(t.cardId, sql`lower(${t.name})`)],
);

export const meetings = pgTable(
  "meetings",
  {
    id: id(),
    boardId: ref("board_id")
      .notNull()
      .references(() => boards.id),
    number: integer().notNull(),
    status: text().$type<MeetingStatus>().notNull().default("planned"),
    startedAt: timestamp({ withTimezone: true }),
    endedAt: timestamp({ withTimezone: true }),
    startedBy: ref("started_by").references(() => users.id),
    endedBy: ref("ended_by").references(() => users.id),
    moderatorId: ref("moderator_id")
      .notNull()
      .references(() => users.id),
    protocolId: ref("protocol_id").references(() => users.id),
    version: integer().notNull().default(0),
    /** Gemeinsamer Fokus: die Karte, die gerade allen gezeigt wird. Ändert die Version nicht. */
    focusCardId: ref("focus_card_id").references(() => cards.id),
    focusBy: ref("focus_by").references(() => users.id),
    focusSince: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex("meetings_board_number_idx").on(t.boardId, t.number),
    uniqueIndex("meetings_board_current_idx")
      .on(t.boardId)
      .where(sql`${t.status} <> 'ended'`),
    check("meetings_status_check", sql`${t.status} IN ('planned', 'running', 'ended')`),
    check(
      "meetings_timestamps_check",
      sql`(${t.status} = 'planned' AND ${t.startedAt} IS NULL AND ${t.endedAt} IS NULL)
        OR (${t.status} = 'running' AND ${t.startedAt} IS NOT NULL AND ${t.endedAt} IS NULL)
        OR (${t.status} = 'ended' AND ${t.startedAt} IS NOT NULL AND ${t.endedAt} IS NOT NULL)`,
    ),
    check("meetings_roles_check", sql`${t.protocolId} IS NULL OR ${t.moderatorId} <> ${t.protocolId}`),
    check(
      "meetings_focus_check",
      sql`(${t.focusCardId} IS NULL AND ${t.focusBy} IS NULL AND ${t.focusSince} IS NULL)
        OR (${t.focusCardId} IS NOT NULL AND ${t.focusBy} IS NOT NULL AND ${t.focusSince} IS NOT NULL)`,
    ),
  ],
);

/** Karten, die in einem Termin besprochen wurden (durch Zeigen oder manuell). */
export const meetingDiscussed = pgTable(
  "meeting_discussed",
  {
    meetingId: ref("meeting_id")
      .notNull()
      .references(() => meetings.id),
    cardId: ref("card_id")
      .notNull()
      .references(() => cards.id),
    markedBy: ref("marked_by")
      .notNull()
      .references(() => users.id),
    markedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.meetingId, t.cardId] })],
);

export const meetingCards = pgTable(
  "meeting_cards",
  {
    meetingId: ref("meeting_id")
      .notNull()
      .references(() => meetings.id),
    cardId: ref("card_id")
      .notNull()
      .references(() => cards.id),
    title: text().notNull(),
    description: text().notNull(),
    color: cardColor(),
    columnAtMeeting: smallint().notNull(),
    people: jsonb().$type<string[]>().notNull(),
    discussed: boolean().notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.meetingId, t.cardId] }),
    cardColorCheck("meeting_cards_color_check", t.color),
  ],
);

export const rotationPool = pgTable(
  "rotation_pool",
  {
    boardId: ref("board_id")
      .notNull()
      .references(() => boards.id),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => [primaryKey({ columns: [t.boardId, t.userId] })],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: id(),
    boardId: ref("board_id")
      .notNull()
      .references(() => boards.id),
    actorId: ref("actor_id")
      .notNull()
      .references(() => users.id),
    at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    action: text().$type<AuditAction>().notNull(),
    targetType: text().$type<AuditEntry["targetType"]>().notNull(),
    targetId: ref("target_id").notNull(),
    data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    index("audit_events_board_idx").on(t.boardId, t.id.desc()),
    index("audit_events_target_idx").on(t.targetType, t.targetId),
  ],
);

/** Tabelle von `connect-pg-simple`, hier definiert, damit Migrationen sie verwalten. */
export const session = pgTable(
  "session",
  {
    sid: varchar().primaryKey(),
    sess: json().notNull(),
    expire: timestamp({ precision: 6 }).notNull(),
  },
  (t) => [index("IDX_session_expire").on(t.expire)],
);
