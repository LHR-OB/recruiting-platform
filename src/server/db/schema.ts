import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  primaryKey,
  varchar as pgVarchar,
  timestamp as pgTimestamp,
  boolean as pgBoolean,
  text as pgText,
  integer as pgInteger,
  pgEnum,
  jsonb as pgJsonb,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `rp_${name}`);

export const userRoleEnum = pgEnum("user_role_enum", [
  "APPLICANT",
  "MEMBER",
  "SYSTEM_LEADER",
  "TEAM_MANAGEMENT",
  "ADMIN",
]);

// Define users table first, without the teamId foreign key initially
export const users = createTable("user", (_) => ({
  id: pgVarchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: pgVarchar("name", { length: 255 }),
  email: pgVarchar("email", { length: 255 }).notNull().unique(),
  emailVerified: pgTimestamp("emailVerified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: pgVarchar("image", { length: 255 }),
  role: userRoleEnum("role").default("APPLICANT").notNull(),
  system: pgVarchar("system", { length: 255 }),
  systemId: pgVarchar("systemId", { length: 255 }),
  teamId: pgVarchar("teamId", { length: 255 }), // Define as plain column first
  createdAt: pgTimestamp("createdAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
  resumeUrl: pgVarchar("resumeUrl", { length: 255 }), // Optional resume URL
  eidEmail: pgVarchar("eidEmail", { length: 255 }), // Optional EID email
  eidEmailVerified: pgBoolean("eidEmailVerified").default(false).notNull(), // EID email verification status
}));

// Define teams table, referencing users.id
export const teams = createTable("team", (_) => ({
  id: pgVarchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: pgVarchar("name", { length: 256 }).notNull(),
  description: pgText("description"),
  createdAt: pgTimestamp("createdAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
  image: pgVarchar("image", { length: 255 }),
  mdx: pgText("mdx"), // Optional MDX content for team page
}));

// Now, it's generally better to define the FK relationship for users.teamId via relations,
// but if a direct FK constraint is needed in the table, it's tricky with circular deps.
// Drizzle's `relations` are the preferred way to model this.
// The `users.teamId` column is already defined. The relation will link it.

export const messages = createTable(
  "message",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    text: pgText("text").notNull(),
    userId: pgVarchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isRead: pgBoolean("isRead").default(false).notNull(),
  }),
  (t) => [index("message_user_id_idx").on(t.userId)],
);

export const systems = createTable(
  "system",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: pgVarchar("name", { length: 256 }).notNull(),
    description: pgText("description"),
    mdx: pgText("mdx"),
    teamId: pgVarchar("teamId", { length: 255 })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [
    index("system_team_id_idx").on(t.teamId),
    index("system_name_idx").on(t.name),
  ],
);

export const events = createTable(
  "event",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: pgText("name").notNull(),
    description: pgText("description"),
    startTime: pgTimestamp("startTime", { withTimezone: true }).notNull(),
    endTime: pgTimestamp("endTime", { withTimezone: true }).notNull(),
    location: pgText("location"),
    createdById: pgVarchar("createdById", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [
    index("event_created_by_idx").on(t.createdById),
    index("event_name_idx").on(t.name),
  ],
);

export const usersToEvents = createTable(
  "users_to_events",
  (_) => ({
    userId: pgVarchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: pgVarchar("eventId", { length: 255 })
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.eventId] }),
    index("user_event_idx").on(t.userId, t.eventId),
  ],
);

export const usersToSystems = createTable(
  "users_to_systems",
  (_) => ({
    userId: pgVarchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    systemId: pgVarchar("systemId", { length: 255 })
      .notNull()
      .references(() => systems.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.systemId] }),
    index("user_system_idx").on(t.userId, t.systemId),
  ],
);

// enum for application cycle status
export const applicationCycleStatusEnum = pgEnum(
  "application_cycle_status_enum",
  ["PREPARATION", "APPLICATION", "INTERVIEW", "TRAIL", "FINAL"],
);

export const applicationCycles = createTable(
  "application_cycle",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: pgVarchar("name", { length: 255 }).notNull(),
    stage: applicationCycleStatusEnum("stage").default("PREPARATION").notNull(),
    startDate: pgTimestamp("startDate", { withTimezone: true }).notNull(),
    endDate: pgTimestamp("endDate", { withTimezone: true }).notNull(),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [index("application_cycle_name_idx").on(t.name)],
);

// Table for detailed stage timelines within each application cycle
export const applicationCycleStages = createTable(
  "application_cycle_stage",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cycleId: pgVarchar("cycleId", { length: 255 })
      .notNull()
      .references(() => applicationCycles.id, { onDelete: "cascade" }),
    stage: applicationCycleStatusEnum("stage").notNull(),
    startDate: pgTimestamp("startDate", { withTimezone: true }).notNull(),
    endDate: pgTimestamp("endDate", { withTimezone: true }).notNull(),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [
    index("cycle_stage_idx").on(t.cycleId, t.stage),
    index("cycle_stage_dates_idx").on(t.cycleId, t.startDate, t.endDate),
  ],
);

export const applicationStatusEnum = pgEnum("application_status_enum", [
  "DRAFT",
  "SUBMITTED",
  "REVIEWED",
  "ACCEPTED",
  "REJECTED",
]);

export const applications = createTable(
  "application",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: pgVarchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: pgVarchar("teamId", { length: 255 })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    systemId: pgVarchar("systemId", { length: 255 }).references(
      () => systems.id,
      { onDelete: "cascade" },
    ),
    applicationCycleId: pgVarchar("applicationCycleId", { length: 255 })
      .notNull()
      .references(() => applicationCycles.id, { onDelete: "cascade" }),
    status: applicationStatusEnum().notNull(),
    internalStatus: applicationCycleStatusEnum()
      .notNull()
      .default("APPLICATION"),
    internalDecision: applicationStatusEnum(),
    data: pgJsonb("data"), // JSON or text blob for application answers
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [
    index("application_user_idx").on(t.userId),
    index("application_cycle_idx").on(t.applicationCycleId),
    index("application_team_idx").on(t.teamId),
    index("application_system_idx").on(t.systemId),
  ],
);

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [applications.teamId],
    references: [teams.id],
  }),
  cycle: one(applicationCycles, {
    fields: [applications.applicationCycleId],
    references: [applicationCycles.id],
  }),
}));

export const availabilities = createTable(
  "availability",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: pgVarchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    systemId: pgVarchar("systemId", { length: 255 })
      .notNull()
      .references(() => systems.id, { onDelete: "cascade" }),
    start: pgTimestamp("start", { withTimezone: true }).notNull(),
    end: pgTimestamp("end", { withTimezone: true }).notNull(),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [
    index("availability_user_idx").on(t.userId),
    index("availability_system_idx").on(t.systemId),
  ],
);

export const interviews = createTable(
  "interview",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: pgVarchar("eventId", { length: 255 }).references(() => events.id, {
      onDelete: "set null",
    }),
    applicationId: pgVarchar("applicationId", { length: 255 }).references(
      () => applications.id,
      { onDelete: "set null" },
    ),
    createdById: pgVarchar("createdById", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [
    index("interview_event_idx").on(t.eventId),
    index("interview_application_idx").on(t.applicationId),
    index("interview_created_by_idx").on(t.createdById),
  ],
);

export const interviewNotes = createTable(
  "interview_note",
  (_) => ({
    id: pgVarchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    interviewId: pgVarchar("interviewId", { length: 255 })
      .notNull()
      .references(() => interviews.id, { onDelete: "cascade" }),
    note: pgText("note").notNull(),
    createdById: pgVarchar("createdById", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: pgTimestamp("createdAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: pgTimestamp("updatedAt", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  }),
  (t) => [
    index("interview_note_interview_idx").on(t.interviewId),
    index("interview_note_created_by_idx").on(t.createdById),
  ],
);

// RELATIONS
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  messages: many(messages),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  system: one(systems, {
    fields: [users.systemId],
    references: [systems.id],
  }),
  usersToEvents: many(usersToEvents),
  usersToSystems: many(usersToSystems),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  systems: many(systems),
  users: many(users),
}));

export const systemsRelations = relations(systems, ({ one, many }) => ({
  team: one(teams, {
    fields: [systems.teamId],
    references: [teams.id],
  }),
  usersToSystems: many(usersToSystems),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  usersToEvents: many(usersToEvents),
}));

export const usersToEventsRelations = relations(usersToEvents, ({ one }) => ({
  user: one(users, {
    fields: [usersToEvents.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [usersToEvents.eventId],
    references: [events.id],
  }),
}));

export const usersToSystemsRelations = relations(usersToSystems, ({ one }) => ({
  user: one(users, {
    fields: [usersToSystems.userId],
    references: [users.id],
  }),
  system: one(systems, {
    fields: [usersToSystems.systemId],
    references: [systems.id],
  }),
}));

export const accounts = createTable(
  "account",
  (_) => ({
    userId: pgVarchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: pgVarchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: pgVarchar("provider", { length: 255 }).notNull(),
    providerAccountId: pgVarchar("providerAccountId", {
      length: 255,
    }).notNull(),
    refresh_token: pgText("refresh_token"),
    access_token: pgText("access_token"),
    expires_at: pgInteger("expires_at"),
    token_type: pgVarchar("token_type", { length: 255 }),
    scope: pgVarchar("scope", { length: 255 }),
    id_token: pgText("id_token"),
    session_state: pgVarchar("session_state", { length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = createTable(
  "session",
  (_) => ({
    sessionToken: pgVarchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: pgVarchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: pgTimestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (_) => ({
    identifier: pgVarchar("identifier", { length: 255 }).notNull(),
    token: pgVarchar("token", { length: 255 }).notNull(),
    expires: pgTimestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  event: one(events, {
    fields: [interviews.eventId],
    references: [events.id],
  }),
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
  createdBy: one(users, {
    fields: [interviews.createdById],
    references: [users.id],
  }),
  notes: many(interviewNotes),
}));

export const interviewNotesRelations = relations(interviewNotes, ({ one }) => ({
  interview: one(interviews, {
    fields: [interviewNotes.interviewId],
    references: [interviews.id],
  }),
  createdBy: one(users, {
    fields: [interviewNotes.createdById],
    references: [users.id],
  }),
}));

export const applicationCyclesRelations = relations(
  applicationCycles,
  ({ many }) => ({
    stages: many(applicationCycleStages),
    applications: many(applications),
  }),
);

export const applicationCycleStagesRelations = relations(
  applicationCycleStages,
  ({ one }) => ({
    cycle: one(applicationCycles, {
      fields: [applicationCycleStages.cycleId],
      references: [applicationCycles.id],
    }),
  }),
);

export const availabilitiesRelations = relations(availabilities, ({ one }) => ({
  user: one(users, {
    fields: [availabilities.userId],
    references: [users.id],
  }),
  system: one(systems, {
    fields: [availabilities.systemId],
    references: [systems.id],
  }),
}));
