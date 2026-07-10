import { eq, and, isNull, count, desc, gte, lte, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, events, attendees, registrations, Event, Attendee, Registration, notifications, eventAnalytics, waitlist, checkins, ticketPricing, eventSurveys, referrals, loyaltyPoints, badges, attendeeProfiles, eventRecommendations, hostVerifications } from "../drizzle/schema";
import { ENV } from './_core/env';
import { avg } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Event queries
export async function createEvent(hostId: number, eventData: {
  title: string;
  description?: string;
  location: string;
  date: Date;
  capacity: number;
  registrationCutoffDate: Date;
  category?: string;
  imageUrl?: string;
  imageKey?: string;
}): Promise<Event> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(events).values({
    hostId,
    ...eventData,
  });

  const eventId = (result as any).insertId;
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return event[0];
}

export async function getEventById(eventId: number): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return result[0];
}

export async function getEventsByHostId(hostId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(events).where(eq(events.hostId, hostId)).orderBy(desc(events.date));
}

export async function getUpcomingEvents(limit?: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  let query = db.select().from(events)
    .where(and(
      gte(events.date, now),
      eq(events.isClosed, false)
    ))
    .orderBy(events.date);

  if (limit) {
    return query.limit(limit);
  }

  return query;
}

export async function updateEvent(eventId: number, updates: Partial<Event>): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(events).set(updates).where(eq(events.id, eventId));
  return getEventById(eventId);
}

export async function deleteEvent(eventId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(events).where(eq(events.id, eventId));
}

// Attendee queries
export async function createAttendee(name: string, email: string, passwordHash: string): Promise<Attendee> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attendees).values({ name, email, passwordHash });
  const attendeeId = (result as any).insertId;
  const attendee = await db.select().from(attendees).where(eq(attendees.id, attendeeId)).limit(1);
  return attendee[0];
}

export async function getAttendeeByEmail(email: string): Promise<Attendee | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(attendees).where(eq(attendees.email, email)).limit(1);
  return result[0];
}

export async function getAttendeeById(attendeeId: number): Promise<Attendee | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(attendees).where(eq(attendees.id, attendeeId)).limit(1);
  return result[0];
}

// Registration queries
export async function registerAttendee(eventId: number, attendeeId: number): Promise<Registration> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(registrations).values({ eventId, attendeeId });
  const registrationId = (result as any).insertId;
  const registration = await db.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1);
  return registration[0];
}

export async function getRegistrationsByAttendeeId(attendeeId: number): Promise<(Registration & { event: Event })[]> {
  const db = await getDb();
  if (!db) return [];

  const registrationList = await db.select().from(registrations)
    .where(and(
      eq(registrations.attendeeId, attendeeId),
      isNull(registrations.cancelledAt)
    ));

  const withEvents = await Promise.all(
    registrationList.map(async (reg) => {
      const event = await getEventById(reg.eventId);
      return { ...reg, event: event! };
    })
  );

  return withEvents;
}

export async function getRegistrationsByEventId(eventId: number): Promise<(Registration & { attendee: Attendee })[]> {
  const db = await getDb();
  if (!db) return [];

  const registrationList = await db.select().from(registrations)
    .where(and(
      eq(registrations.eventId, eventId),
      isNull(registrations.cancelledAt)
    ));

  const withAttendees = await Promise.all(
    registrationList.map(async (reg) => {
      const attendee = await getAttendeeById(reg.attendeeId);
      return { ...reg, attendee: attendee! };
    })
  );

  return withAttendees;
}

export async function getRegistrationCount(eventId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() }).from(registrations)
    .where(and(
      eq(registrations.eventId, eventId),
      isNull(registrations.cancelledAt)
    ));

  return result[0]?.count || 0;
}

export async function checkRegistrationExists(eventId: number, attendeeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(registrations)
    .where(and(
      eq(registrations.eventId, eventId),
      eq(registrations.attendeeId, attendeeId),
      isNull(registrations.cancelledAt)
    ))
    .limit(1);

  return result.length > 0;
}

export async function cancelRegistration(eventId: number, attendeeId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(registrations)
    .set({ cancelledAt: new Date() })
    .where(and(
      eq(registrations.eventId, eventId),
      eq(registrations.attendeeId, attendeeId),
      isNull(registrations.cancelledAt)
    ));
}

// Notification queries
export async function createNotification(
  attendeeId: number,
  eventId: number,
  type: "registration_confirmation" | "event_reminder" | "cancellation_confirmation",
  email: string,
  subject: string,
  body: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values({
    attendeeId,
    eventId,
    type,
    email,
    subject,
    body,
  });

  return result;
}

export async function markNotificationAsSent(notificationId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications)
    .set({ sentAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function getUnsentNotifications() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(isNull(notifications.sentAt));
}

// Analytics queries
export async function getOrCreateAnalytics(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(eventAnalytics)
    .where(eq(eventAnalytics.eventId, eventId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(eventAnalytics).values({
    eventId,
    totalViews: 0,
    totalRegistrations: 0,
    totalCancellations: 0,
    conversionRate: "0%",
  });

  return db.select().from(eventAnalytics)
    .where(eq(eventAnalytics.eventId, eventId))
    .limit(1)
    .then(r => r[0]);
}

export async function incrementEventViews(eventId: number) {
  const db = await getDb();
  if (!db) return;

  const analytics = await getOrCreateAnalytics(eventId);
  if (analytics) {
    await db.update(eventAnalytics)
      .set({ totalViews: analytics.totalViews + 1 })
      .where(eq(eventAnalytics.eventId, eventId));
  }
}

export async function updateAnalyticsOnRegistration(eventId: number) {
  const db = await getDb();
  if (!db) return;

  const analytics = await getOrCreateAnalytics(eventId);
  if (analytics) {
    const newTotal = analytics.totalRegistrations + 1;
    const event = await getEventById(eventId);
    const rate = event ? Math.round((newTotal / event.capacity) * 100) : 0;

    await db.update(eventAnalytics)
      .set({
        totalRegistrations: newTotal,
        conversionRate: `${rate}%`,
      })
      .where(eq(eventAnalytics.eventId, eventId));
  }
}

export async function updateAnalyticsOnCancellation(eventId: number) {
  const db = await getDb();
  if (!db) return;

  const analytics = await getOrCreateAnalytics(eventId);
  if (analytics) {
    const newCancellations = analytics.totalCancellations + 1;
    const newRegistrations = Math.max(0, analytics.totalRegistrations - 1);
    const event = await getEventById(eventId);
    const rate = event ? Math.round((newRegistrations / event.capacity) * 100) : 0;

    await db.update(eventAnalytics)
      .set({
        totalCancellations: newCancellations,
        totalRegistrations: newRegistrations,
        conversionRate: `${rate}%`,
      })
      .where(eq(eventAnalytics.eventId, eventId));
  }
}

export async function getEventAnalytics(eventId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(eventAnalytics)
    .where(eq(eventAnalytics.eventId, eventId))
    .limit(1);

  return result[0];
}

// Waitlist queries
export async function addToWaitlist(eventId: number, attendeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const position = await db.select({ maxPos: max(waitlist.position) })
    .from(waitlist)
    .where(eq(waitlist.eventId, eventId))
    .then(r => (r[0]?.maxPos || 0) + 1);

  const result = await db.insert(waitlist).values({
    eventId,
    attendeeId,
    position,
  });

  return result;
}

export async function getWaitlistPosition(eventId: number, attendeeId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(waitlist)
    .where(and(
      eq(waitlist.eventId, eventId),
      eq(waitlist.attendeeId, attendeeId),
      isNull(waitlist.promotedAt)
    ))
    .limit(1);

  return result[0];
}

export async function promoteFromWaitlist(eventId: number, attendeeId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(waitlist)
    .set({ promotedAt: new Date() })
    .where(and(
      eq(waitlist.eventId, eventId),
      eq(waitlist.attendeeId, attendeeId)
    ));
}

export async function getWaitlistForEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(waitlist)
    .where(and(
      eq(waitlist.eventId, eventId),
      isNull(waitlist.promotedAt)
    ))
    .orderBy(waitlist.position);
}

// Check-in queries
export async function createCheckin(registrationId: number, eventId: number, attendeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(checkins).values({
    registrationId,
    eventId,
    attendeeId,
  });

  return result;
}

export async function getCheckinsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(checkins)
    .where(eq(checkins.eventId, eventId))
    .orderBy(desc(checkins.checkedInAt));
}

export async function getCheckinsByAttendee(attendeeId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(checkins)
    .where(eq(checkins.attendeeId, attendeeId))
    .orderBy(desc(checkins.checkedInAt));
}

export async function hasAttendeeCheckedIn(registrationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(checkins)
    .where(eq(checkins.registrationId, registrationId))
    .limit(1);

  return result.length > 0;
}



// Ticket Pricing queries (Feature 1)
export async function createTicketPricing(eventId: number, tier: string, price: number, quantity: number, description?: string, validUntil?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(ticketPricing).values({
    eventId,
    tier: tier as any,
    price,
    quantity,
    description,
    validUntil,
  });
}

export async function getTicketPricingByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(ticketPricing)
    .where(eq(ticketPricing.eventId, eventId));
}

// Event Surveys queries (Feature 2)
export async function createEventSurvey(eventId: number, attendeeId: number, rating: number, feedback?: string, npsScore?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(eventSurveys).values({
    eventId,
    attendeeId,
    rating,
    feedback,
    npsScore,
  });
}

export async function getEventSurveys(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(eventSurveys)
    .where(eq(eventSurveys.eventId, eventId));
}

export async function getAverageEventRating(eventId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ avg: avg(eventSurveys.rating) })
    .from(eventSurveys)
    .where(eq(eventSurveys.eventId, eventId));

  return result[0]?.avg ? parseFloat(result[0].avg.toString()) : 0;
}

// Referral queries (Feature 4)
export async function createReferral(referrerId: number, eventId: number, referralCode: string, expiresAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(referrals).values({
    referrerId,
    eventId,
    referralCode,
    expiresAt,
  });
}

export async function getReferralByCode(referralCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(referrals)
    .where(eq(referrals.referralCode, referralCode))
    .limit(1);

  return result[0];
}

export async function incrementReferralCount(referralId: number) {
  const db = await getDb();
  if (!db) return;

  const referral = await db.select().from(referrals)
    .where(eq(referrals.id, referralId))
    .limit(1);

  if (referral[0]) {
    await db.update(referrals)
      .set({ successCount: referral[0].successCount + 1 })
      .where(eq(referrals.id, referralId));
  }
}

// Loyalty Points queries (Feature 5)
export async function getOrCreateLoyaltyPoints(attendeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(loyaltyPoints)
    .where(eq(loyaltyPoints.attendeeId, attendeeId))
    .limit(1);

  if (existing[0]) return existing[0];

  await db.insert(loyaltyPoints).values({
    attendeeId,
    totalPoints: 0,
    tier: "bronze",
  });

  return db.select().from(loyaltyPoints)
    .where(eq(loyaltyPoints.attendeeId, attendeeId))
    .limit(1)
    .then(r => r[0]);
}

export async function addLoyaltyPoints(attendeeId: number, points: number) {
  const db = await getDb();
  if (!db) return;

  const loyalty = await getOrCreateLoyaltyPoints(attendeeId);
  if (loyalty) {
    const newTotal = loyalty.totalPoints + points;
    let newTier = loyalty.tier;
    if (newTotal >= 1000) newTier = "platinum";
    else if (newTotal >= 500) newTier = "gold";
    else if (newTotal >= 200) newTier = "silver";

    await db.update(loyaltyPoints)
      .set({ totalPoints: newTotal, tier: newTier as any })
      .where(eq(loyaltyPoints.attendeeId, attendeeId));
  }
}

// Badges queries (Feature 6)
export async function awardBadge(attendeeId: number, badgeType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if badge already exists
  const existing = await db.select().from(badges)
    .where(and(
      eq(badges.attendeeId, attendeeId),
      eq(badges.badgeType, badgeType as any)
    ))
    .limit(1);

  if (existing.length > 0) return existing[0];

  return db.insert(badges).values({
    attendeeId,
    badgeType: badgeType as any,
  });
}

export async function getAttendeeBadges(attendeeId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(badges)
    .where(eq(badges.attendeeId, attendeeId));
}

// Attendee Profiles queries (Feature 8)
export async function getOrCreateAttendeeProfile(attendeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(attendeeProfiles)
    .where(eq(attendeeProfiles.attendeeId, attendeeId))
    .limit(1);

  if (existing[0]) return existing[0];

  await db.insert(attendeeProfiles).values({
    attendeeId,
    isPublic: true,
  });

  return db.select().from(attendeeProfiles)
    .where(eq(attendeeProfiles.attendeeId, attendeeId))
    .limit(1)
    .then(r => r[0]);
}

export async function updateAttendeeProfile(attendeeId: number, data: any) {
  const db = await getDb();
  if (!db) return;

  await db.update(attendeeProfiles)
    .set(data)
    .where(eq(attendeeProfiles.attendeeId, attendeeId));
}

export async function getPublicAttendeeProfiles() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(attendeeProfiles)
    .where(eq(attendeeProfiles.isPublic, true));
}

// Event Recommendations queries (Feature 9)
export async function createEventRecommendation(attendeeId: number, eventId: number, score: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(eventRecommendations).values({
    attendeeId,
    eventId,
    score,
    reason,
  });
}

export async function getRecommendedEvents(attendeeId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(eventRecommendations)
    .where(eq(eventRecommendations.attendeeId, attendeeId))
    .orderBy(desc(eventRecommendations.score))
    .limit(limit);
}

// Host Verification queries (Feature 10)
export async function getOrCreateHostVerification(hostId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(hostVerifications)
    .where(eq(hostVerifications.hostId, hostId))
    .limit(1);

  if (existing[0]) return existing[0];

  await db.insert(hostVerifications).values({
    hostId,
    emailVerified: false,
    phoneVerified: false,
    idVerified: false,
    trustScore: 0,
    totalEventsHosted: 0,
    averageRating: "0.0",
  });

  return db.select().from(hostVerifications)
    .where(eq(hostVerifications.hostId, hostId))
    .limit(1)
    .then(r => r[0]);
}

export async function updateHostVerification(hostId: number, data: any) {
  const db = await getDb();
  if (!db) return;

  await db.update(hostVerifications)
    .set(data)
    .where(eq(hostVerifications.hostId, hostId));
}

export async function getHostTrustBadge(hostId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const verification = await db.select().from(hostVerifications)
    .where(eq(hostVerifications.hostId, hostId))
    .limit(1);

  if (!verification[0]) return undefined;

  const v = verification[0];
  if (v.idVerified && v.emailVerified) return "verified";
  if (v.emailVerified) return "email_verified";
  return undefined;
}


