import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";


export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Events Router
  events: router({
    // Get all upcoming events (public)
    getUpcoming: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getUpcomingEvents(input?.limit);
      }),

    // Get event by ID (public)
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        const registrationCount = await db.getRegistrationCount(input);
        return { ...event, registrationCount };
      }),

    // Get events by host (protected)
    getByHost: protectedProcedure
      .query(async ({ ctx }) => {
        const events = await db.getEventsByHostId(ctx.user.id);
        const withCounts = await Promise.all(
          events.map(async (event) => ({
            ...event,
            registrationCount: await db.getRegistrationCount(event.id),
          }))
        );
        return withCounts;
      }),

    // Create event (protected)
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        location: z.string().min(1, "Location is required"),
        date: z.date(),
        capacity: z.number().int().positive("Capacity must be positive"),
        registrationCutoffDate: z.date(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.registrationCutoffDate >= input.date) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Registration cutoff date must be before event date",
          });
        }

        return db.createEvent(ctx.user.id, {
          ...input,
        });
      }),

    // Update event (protected)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        date: z.date().optional(),
        capacity: z.number().int().positive().optional(),
        registrationCutoffDate: z.date().optional(),
        category: z.string().optional(),
        isClosed: z.boolean().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        const { id, ...updates } = input;
        return db.updateEvent(id, updates);
      }),

    // Delete event (protected)
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.deleteEvent(input);
        return { success: true };
      }),

    // Close event (protected)
    close: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        return db.updateEvent(input, { isClosed: true });
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        imageData: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        try {
          const buffer = Buffer.from(input.imageData, "base64");
          const { key, url } = await storagePut(
            `events/${input.eventId}/banner/${input.fileName}`,
            buffer,
            "image/jpeg"
          );

          return db.updateEvent(input.eventId, {
            imageUrl: url,
            imageKey: key,
          });
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to upload image: ${error.message}`,
          });
        }
      }),

    deleteImage: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input: eventId }) => {
        const event = await db.getEventById(eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        try {
          return db.updateEvent(eventId, {
            imageUrl: null,
            imageKey: null,
          });
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete image: ${error.message}`,
          });
        }
      }),
  }),

  // Attendees Router
  attendees: router({
    // Register attendee (public)
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getAttendeeByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        return db.createAttendee(input.name, input.email, passwordHash);
      }),

    // Login attendee (public)
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const attendee = await db.getAttendeeByEmail(input.email);
        if (!attendee) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        const isValid = await bcrypt.compare(input.password, attendee.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        return { id: attendee.id, name: attendee.name, email: attendee.email };
      }),

    // Get attendee by ID (protected for attendees)
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const attendee = await db.getAttendeeById(input);
        if (!attendee) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Attendee not found" });
        }
        // Don't return password hash
        const { passwordHash, ...safe } = attendee;
        return safe;
      }),
  }),

  // Registrations Router
  registrations: router({
    // Register for event (public)
    register: publicProcedure
      .input(z.object({
        eventId: z.number(),
        attendeeId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        if (event.isClosed) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Event is closed" });
        }

        const now = new Date();
        if (now > event.registrationCutoffDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Registration cutoff date has passed",
          });
        }

        const exists = await db.checkRegistrationExists(input.eventId, input.attendeeId);
        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Already registered for this event",
          });
        }

        const registrationCount = await db.getRegistrationCount(input.eventId);
        if (registrationCount >= event.capacity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Event is at full capacity",
          });
        }

        return db.registerAttendee(input.eventId, input.attendeeId);
      }),

    // Get registrations by attendee (public)
    getByAttendee: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getRegistrationsByAttendeeId(input);
      }),

    // Get registrations by event (protected)
    getByEvent: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        return db.getRegistrationsByEventId(input);
      }),

    // Cancel registration (public)
    cancel: publicProcedure
      .input(z.object({
        eventId: z.number(),
        attendeeId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const exists = await db.checkRegistrationExists(input.eventId, input.attendeeId);
        if (!exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Registration not found",
          });
        }

        await db.cancelRegistration(input.eventId, input.attendeeId);
        return { success: true };
      }),

    // Export registrations as CSV (protected)
    exportCsv: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        const registrations = await db.getRegistrationsByEventId(input);
        const csvContent = [
          "Name,Email",
          ...registrations.map(r => `"${r.attendee.name}","${r.attendee.email}"`),
        ].join("\n");

        return csvContent;
      }),
  }),

  // Analytics Router
  analytics: router({
    // Get event analytics (protected)
    getByEvent: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        return db.getEventAnalytics(input);
      }),

    // Track event view (public)
    trackView: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.incrementEventViews(input);
        return { success: true };
      }),
  }),

  // Waitlist Router
  waitlist: router({
    // Add to waitlist (public)
    add: publicProcedure
      .input(z.object({
        eventId: z.number(),
        attendeeId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        return db.addToWaitlist(input.eventId, input.attendeeId);
      }),

    // Get waitlist position (public)
    getPosition: publicProcedure
      .input(z.object({
        eventId: z.number(),
        attendeeId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getWaitlistPosition(input.eventId, input.attendeeId);
      }),

    // Get waitlist for event (protected)
    getByEvent: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        return db.getWaitlistForEvent(input);
      }),
  }),

  // Check-in Router
  checkins: router({
    // Create check-in (protected)
    create: protectedProcedure
      .input(z.object({
        registrationId: z.number(),
        eventId: z.number(),
        attendeeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        return db.createCheckin(input.registrationId, input.eventId, input.attendeeId);
      }),

    // Get check-ins by event (protected)
    getByEvent: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        if (event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        return db.getCheckinsByEvent(input);
      }),

    // Check if attendee checked in (public)
    hasCheckedIn: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.hasAttendeeCheckedIn(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
