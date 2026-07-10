CREATE TABLE `attendee_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendeeId` int NOT NULL,
	`bio` text,
	`interests` text,
	`industry` varchar(100),
	`linkedinUrl` varchar(500),
	`twitterUrl` varchar(500),
	`websiteUrl` varchar(500),
	`profileImageUrl` varchar(500),
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendee_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendee_profiles_attendeeId_unique` UNIQUE(`attendeeId`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendeeId` int NOT NULL,
	`badgeType` enum('first_event','five_events','ten_events','super_fan','referral_master','early_bird','night_owl','weekend_warrior') NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendeeId` int NOT NULL,
	`eventId` int NOT NULL,
	`score` int NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`attendeeId` int NOT NULL,
	`rating` int NOT NULL,
	`feedback` text,
	`npsScore` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `host_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`phoneVerified` boolean NOT NULL DEFAULT false,
	`idVerified` boolean NOT NULL DEFAULT false,
	`trustScore` int NOT NULL DEFAULT 0,
	`totalEventsHosted` int NOT NULL DEFAULT 0,
	`averageRating` varchar(5) NOT NULL DEFAULT '0.0',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `host_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `host_verifications_hostId_unique` UNIQUE(`hostId`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendeeId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyalty_points_attendeeId_unique` UNIQUE(`attendeeId`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referralCode` varchar(50) NOT NULL,
	`eventId` int NOT NULL,
	`successCount` int NOT NULL DEFAULT 0,
	`rewardStatus` enum('pending','claimed','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` datetime,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `ticket_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`tier` enum('early_bird','regular','vip','group') NOT NULL,
	`price` int NOT NULL,
	`quantity` int NOT NULL,
	`quantitySold` int NOT NULL DEFAULT 0,
	`description` text,
	`validUntil` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `attendee_profiles` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `badges` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `event_recommendations` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `event_recommendations` (`eventId`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `event_surveys` (`eventId`);--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `event_surveys` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `host_id_idx` ON `host_verifications` (`hostId`);--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `loyalty_points` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `referrer_id_idx` ON `referrals` (`referrerId`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `referrals` (`eventId`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `referrals` (`referralCode`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `ticket_pricing` (`eventId`);