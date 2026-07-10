// TOP 10 Features Routers
// This file contains all the tRPC procedures for the TOP 10 unique features

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const top10Router = {
  // Feature 1: Tiered Ticket Pricing
  ticketing: router({
    createPricing: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        tier: z.enum(["early_bird", "regular", "vip", "group"]),
        price: z.number().min(0),
        quantity: z.number().min(1),
        description: z.string().optional(),
        validUntil: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event || event.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return db.createTicketPricing(input.eventId, input.tier, input.price, input.quantity, input.description, input.validUntil);
      }),

    getByEvent: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getTicketPricingByEvent(input);
      }),
  }),

  // Feature 2: Event Surveys & Feedback
  surveys: router({
    submit: publicProcedure
      .input(z.object({
        eventId: z.number(),
        attendeeId: z.number(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
        npsScore: z.number().min(0).max(10).optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createEventSurvey(input.eventId, input.attendeeId, input.rating, input.feedback, input.npsScore);
      }),

    getByEvent: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getEventSurveys(input);
      }),

    getAverageRating: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getAverageEventRating(input);
      }),
  }),

  // Feature 4: Referral System
  referrals: router({
    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        const code = `REF-${ctx.user.id}-${Date.now()}`;
        return db.createReferral(ctx.user.id, input.eventId, code, input.expiresAt);
      }),

    getByCode: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return db.getReferralByCode(input);
      }),

    incrementCount: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return db.incrementReferralCount(input);
      }),
  }),

  // Feature 5: Loyalty Program
  loyalty: router({
    getPoints: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getOrCreateLoyaltyPoints(input);
      }),

    addPoints: protectedProcedure
      .input(z.object({
        attendeeId: z.number(),
        points: z.number().min(1),
      }))
      .mutation(async ({ input }) => {
        return db.addLoyaltyPoints(input.attendeeId, input.points);
      }),
  }),

  // Feature 6: Badges & Achievements
  badges: router({
    award: protectedProcedure
      .input(z.object({
        attendeeId: z.number(),
        badgeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        return db.awardBadge(input.attendeeId, input.badgeType);
      }),

    getByAttendee: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getAttendeeBadges(input);
      }),
  }),

  // Feature 8: Attendee Networking Profiles
  profiles: router({
    getOrCreate: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getOrCreateAttendeeProfile(input);
      }),

    update: protectedProcedure
      .input(z.object({
        attendeeId: z.number(),
        bio: z.string().optional(),
        interests: z.string().optional(),
        industry: z.string().optional(),
        linkedinUrl: z.string().optional(),
        twitterUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateAttendeeProfile(input.attendeeId, input);
      }),

    getPublic: publicProcedure
      .query(async () => {
        return db.getPublicAttendeeProfiles();
      }),
  }),

  // Feature 9: Event Recommendations
  recommendations: router({
    create: protectedProcedure
      .input(z.object({
        attendeeId: z.number(),
        eventId: z.number(),
        score: z.number().min(0).max(100),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createEventRecommendation(input.attendeeId, input.eventId, input.score, input.reason);
      }),

    getForAttendee: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getRecommendedEvents(input);
      }),
  }),

  // Feature 10: Host Verification & Trust Badges
  verification: router({
    getHost: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getOrCreateHostVerification(input);
      }),

    updateVerification: protectedProcedure
      .input(z.object({
        hostId: z.number(),
        emailVerified: z.boolean().optional(),
        phoneVerified: z.boolean().optional(),
        idVerified: z.boolean().optional(),
        trustScore: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id !== input.hostId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return db.updateHostVerification(input.hostId, input);
      }),

    getTrustBadge: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getHostTrustBadge(input);
      }),
  }),
};
