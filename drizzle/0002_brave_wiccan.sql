CREATE TABLE `accountPasskeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`credentialId` varchar(512) NOT NULL,
	`publicKey` text NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`transports` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `accountPasskeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `accountPasskeys_credential_unique` UNIQUE(`credentialId`)
);
--> statement-breakpoint
CREATE TABLE `emailCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(128) NOT NULL,
	`passwordSalt` varchar(64) NOT NULL,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailCredentials_email_unique` UNIQUE(`email`),
	CONSTRAINT `emailCredentials_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `localAuthChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(320) NOT NULL,
	`challenge` varchar(512) NOT NULL,
	`purpose` enum('register','authenticate') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `localAuthChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `localAuthSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `localAuthSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `localAuthSessions_token_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `accountPasskeys` ADD CONSTRAINT `accountPasskeys_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailCredentials` ADD CONSTRAINT `emailCredentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `localAuthSessions` ADD CONSTRAINT `localAuthSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accountPasskeys_user_idx` ON `accountPasskeys` (`userId`);--> statement-breakpoint
CREATE INDEX `localAuthChallenges_identifier_purpose_idx` ON `localAuthChallenges` (`identifier`,`purpose`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `localAuthSessions_user_expiry_idx` ON `localAuthSessions` (`userId`,`expiresAt`);