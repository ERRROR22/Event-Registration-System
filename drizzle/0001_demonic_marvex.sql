CREATE TABLE `attendees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendees_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`location` varchar(255) NOT NULL,
	`date` datetime NOT NULL,
	`capacity` int NOT NULL,
	`registrationCutoffDate` datetime NOT NULL,
	`category` varchar(100),
	`isClosed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`attendeeId` int NOT NULL,
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	`cancelledAt` timestamp,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `attendees` (`email`);--> statement-breakpoint
CREATE INDEX `hostId_idx` ON `events` (`hostId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `events` (`date`);--> statement-breakpoint
CREATE INDEX `eventId_idx` ON `registrations` (`eventId`);--> statement-breakpoint
CREATE INDEX `attendeeId_idx` ON `registrations` (`attendeeId`);--> statement-breakpoint
CREATE INDEX `unique_registration` ON `registrations` (`eventId`,`attendeeId`);