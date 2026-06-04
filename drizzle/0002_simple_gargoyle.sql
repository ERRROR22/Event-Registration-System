CREATE TABLE `checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`eventId` int NOT NULL,
	`attendeeId` int NOT NULL,
	`checkedInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`totalViews` int NOT NULL DEFAULT 0,
	`totalRegistrations` int NOT NULL DEFAULT 0,
	`totalCancellations` int NOT NULL DEFAULT 0,
	`conversionRate` varchar(10) NOT NULL DEFAULT '0%',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_analytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_analytics_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendeeId` int NOT NULL,
	`eventId` int NOT NULL,
	`type` enum('registration_confirmation','event_reminder','cancellation_confirmation') NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`attendeeId` int NOT NULL,
	`position` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`promotedAt` timestamp,
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` ADD `imageUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `events` ADD `imageKey` varchar(255);--> statement-breakpoint
CREATE INDEX `registration_id_idx` ON `checkins` (`registrationId`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `checkins` (`eventId`);--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `checkins` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `event_analytics` (`eventId`);--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `notifications` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `notifications` (`eventId`);--> statement-breakpoint
CREATE INDEX `event_id_idx` ON `waitlist` (`eventId`);--> statement-breakpoint
CREATE INDEX `attendee_id_idx` ON `waitlist` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `unique_waitlist` ON `waitlist` (`eventId`,`attendeeId`);