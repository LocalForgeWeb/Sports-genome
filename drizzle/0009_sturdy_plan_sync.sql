CREATE TABLE `athleteWorkoutPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planJson` mediumtext NOT NULL,
	`planVersion` int NOT NULL DEFAULT 2,
	`revision` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `athleteWorkoutPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `athleteWorkoutPlans_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `athleteWorkoutPlans` ADD CONSTRAINT `athleteWorkoutPlans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
