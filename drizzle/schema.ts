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


/**
 * Ticket Pricing table - stores tiered pricing for events (Feature 1)
 */
export const ticketPricing = mysqlTable("ticket_pricing", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  tier: mysqlEnum("tier", ["early_bird", "regular", "vip", "group"]).notNull(),
  price: int("price").notNull(), // in cents
  quantity: int("quantity").notNull(),
  quantitySold: int("quantitySold").default(0).notNull(),
  description: text("description"),
  validUntil: datetime("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("event_id_idx").on(table.eventId),
}));

export type TicketPrice = typeof ticketPricing.$inferSelect;
export type InsertTicketPrice = typeof ticketPricing.$inferInsert;

/**
 * Event Surveys/Feedback table (Feature 2)
 */
export const eventSurveys = mysqlTable("event_surveys", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  attendeeId: int("attendeeId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  feedback: text("feedback"),
  npsScore: int("npsScore"), // 0-10
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("event_id_idx").on(table.eventId),
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
}));

export type EventSurvey = typeof eventSurveys.$inferSelect;
export type InsertEventSurvey = typeof eventSurveys.$inferInsert;

/**
 * Referral System table (Feature 4)
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
  eventId: int("eventId").notNull(),
  successCount: int("successCount").default(0).notNull(),
  rewardStatus: mysqlEnum("rewardStatus", ["pending", "claimed", "expired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: datetime("expiresAt"),
}, (table) => ({
  referrerIdIdx: index("referrer_id_idx").on(table.referrerId),
  eventIdIdx: index("event_id_idx").on(table.eventId),
  codeIdx: index("code_idx").on(table.referralCode),
}));

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Loyalty Program table (Feature 5)
 */
export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: int("id").autoincrement().primaryKey(),
  attendeeId: int("attendeeId").notNull().unique(),
  totalPoints: int("totalPoints").default(0).notNull(),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
}));

export type LoyaltyPoints = typeof loyaltyPoints.$inferSelect;
export type InsertLoyaltyPoints = typeof loyaltyPoints.$inferInsert;

/**
 * Badges & Achievements table (Feature 6)
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  attendeeId: int("attendeeId").notNull(),
  badgeType: mysqlEnum("badgeType", [
    "first_event",
    "five_events",
    "ten_events",
    "super_fan",
    "referral_master",
    "early_bird",
    "night_owl",
    "weekend_warrior"
  ]).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
}));

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * Attendee Profiles table - for networking (Feature 8)
 */
export const attendeeProfiles = mysqlTable("attendee_profiles", {
  id: int("id").autoincrement().primaryKey(),
  attendeeId: int("attendeeId").notNull().unique(),
  bio: text("bio"),
  interests: text("interests"), // JSON array
  industry: varchar("industry", { length: 100 }),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  twitterUrl: varchar("twitterUrl", { length: 500 }),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  profileImageUrl: varchar("profileImageUrl", { length: 500 }),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
}));

export type AttendeeProfile = typeof attendeeProfiles.$inferSelect;
export type InsertAttendeeProfile = typeof attendeeProfiles.$inferInsert;

/**
 * Event Recommendations table (Feature 9)
 */
export const eventRecommendations = mysqlTable("event_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  attendeeId: int("attendeeId").notNull(),
  eventId: int("eventId").notNull(),
  score: int("score").notNull(), // 0-100 relevance score
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  attendeeIdIdx: index("attendee_id_idx").on(table.attendeeId),
  eventIdIdx: index("event_id_idx").on(table.eventId),
}));

export type EventRecommendation = typeof eventRecommendations.$inferSelect;
export type InsertEventRecommendation = typeof eventRecommendations.$inferInsert;

/**
 * Host Verification table (Feature 10)
 */
export const hostVerifications = mysqlTable("host_verifications", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  phoneVerified: boolean("phoneVerified").default(false).notNull(),
  idVerified: boolean("idVerified").default(false).notNull(),
  trustScore: int("trustScore").default(0).notNull(), // 0-100
  totalEventsHosted: int("totalEventsHosted").default(0).notNull(),
  averageRating: varchar("averageRating", { length: 5 }).default("0.0").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  hostIdIdx: index("host_id_idx").on(table.hostId),
}));

export type HostVerification = typeof hostVerifications.$inferSelect;
export type InsertHostVerification = typeof hostVerifications.$inferInsert;

/**
 * Relations for new tables
 */
export const ticketPricingRelations = relations(ticketPricing, ({ one }) => ({
  event: one(events, {
    fields: [ticketPricing.eventId],
    references: [events.id],
  }),
}));

export const eventSurveysRelations = relations(eventSurveys, ({ one }) => ({
  event: one(events, {
    fields: [eventSurveys.eventId],
    references: [events.id],
  }),
  attendee: one(attendees, {
    fields: [eventSurveys.attendeeId],
    references: [attendees.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(attendees, {
    fields: [referrals.referrerId],
    references: [attendees.id],
  }),
  event: one(events, {
    fields: [referrals.eventId],
    references: [events.id],
  }),
}));

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  attendee: one(attendees, {
    fields: [loyaltyPoints.attendeeId],
    references: [attendees.id],
  }),
}));

export const badgesRelations = relations(badges, ({ one }) => ({
  attendee: one(attendees, {
    fields: [badges.attendeeId],
    references: [attendees.id],
  }),
}));

export const attendeeProfilesRelations = relations(attendeeProfiles, ({ one }) => ({
  attendee: one(attendees, {
    fields: [attendeeProfiles.attendeeId],
    references: [attendees.id],
  }),
}));

export const eventRecommendationsRelations = relations(eventRecommendations, ({ one }) => ({
  attendee: one(attendees, {
    fields: [eventRecommendations.attendeeId],
    references: [attendees.id],
  }),
  event: one(events, {
    fields: [eventRecommendations.eventId],
    references: [events.id],
  }),
}));

export const hostVerificationsRelations = relations(hostVerifications, ({ one }) => ({
  host: one(users, {
    fields: [hostVerifications.hostId],
    references: [users.id],
  }),
}));
