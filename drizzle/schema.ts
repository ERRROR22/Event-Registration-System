import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, datetime, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table - stores event information created by hosts
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }).notNull(),
  date: datetime("date").notNull(),
  capacity: int("capacity").notNull(),
  registrationCutoffDate: datetime("registrationCutoffDate").notNull(),
  category: varchar("category", { length: 100 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  imageKey: varchar("imageKey", { length: 255 }),
  isClosed: boolean("isClosed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  hostIdIdx: index("hostId_idx").on(table.hostId),
  dateIdx: index("date_idx").on(table.date),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Attendees table - stores attendee information (separate from users for OAuth hosts)
 */
export const attendees = mysqlTable("attendees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}));

export type Attendee = typeof attendees.$inferSelect;
export type InsertAttendee = typeof attendees.$inferInsert;

/**
 * Registrations table - links attendees to events
 */
export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  attendeeId: int("attendeeId").notNull(),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt"),
}, (table) => ({
  eventIdIdx: index("eventId_idx").on(table.eventId),
  attendeeIdIdx: index("attendeeId_idx").on(table.attendeeId),
  uniqueRegistration: index("unique_registration").on(table.eventId, table.attendeeId),
}));

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

/**
 * Relations for type safety
 */
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  registrations: many(registrations),
}));

export const attendeesRelations = relations(attendees, ({ many }) => ({
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  attendee: one(attendees, {
    fields: [registrations.attendeeId],
    references: [attendees.id],
  }),
}));

/**
 * Notifications table - stores email notifications for registrations and reminders
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  attendeeId: int("attendeeId").notNull(),
  eventId: int("eventId").notNull(),
  type: mysqlEnum("type", ["registration_confirmation", "event_reminder", "cancellation_confirmation"]).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
  eventIdIdx: index("event_id_idx").on(table.eventId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Event Analytics table - tracks event statistics
 */
export const eventAnalytics = mysqlTable("event_analytics", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().unique(),
  totalViews: int("totalViews").default(0).notNull(),
  totalRegistrations: int("totalRegistrations").default(0).notNull(),
  totalCancellations: int("totalCancellations").default(0).notNull(),
  conversionRate: varchar("conversionRate", { length: 10 }).default("0%").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventIdIdx: index("event_id_idx").on(table.eventId),
}));

export type EventAnalytic = typeof eventAnalytics.$inferSelect;
export type InsertEventAnalytic = typeof eventAnalytics.$inferInsert;

/**
 * Waitlist table - manages attendees waiting for capacity
 */
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  attendeeId: int("attendeeId").notNull(),
  position: int("position").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  promotedAt: timestamp("promotedAt"),
}, (table) => ({
  eventIdIdx: index("event_id_idx").on(table.eventId),
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
  uniqueWaitlist: index("unique_waitlist").on(table.eventId, table.attendeeId),
}));

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type InsertWaitlistEntry = typeof waitlist.$inferInsert;

/**
 * Check-in table - tracks attendee check-ins at events
 */
export const checkins = mysqlTable("checkins", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  eventId: int("eventId").notNull(),
  attendeeId: int("attendeeId").notNull(),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
}, (table) => ({
  registrationIdIdx: index("registration_id_idx").on(table.registrationId),
  eventIdIdx: index("event_id_idx").on(table.eventId),
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
}));

export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = typeof checkins.$inferInsert;

/**
 * Relations for new tables
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  attendee: one(attendees, {
    fields: [notifications.attendeeId],
    references: [attendees.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
}));

export const eventAnalyticsRelations = relations(eventAnalytics, ({ one }) => ({
  event: one(events, {
    fields: [eventAnalytics.eventId],
    references: [events.id],
  }),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  event: one(events, {
    fields: [waitlist.eventId],
    references: [events.id],
  }),
  attendee: one(attendees, {
    fields: [waitlist.attendeeId],
    references: [attendees.id],
  }),
}));

export const checkinsRelations = relations(checkins, ({ one }) => ({
  registration: one(registrations, {
    fields: [checkins.registrationId],
    references: [registrations.id],
  }),
  event: one(events, {
    fields: [checkins.eventId],
    references: [events.id],
  }),
  attendee: one(attendees, {
    fields: [checkins.attendeeId],
    references: [attendees.id],
  }),
}));