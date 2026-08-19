CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `workoutSessionExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`catalogExerciseId` int,
	`exerciseName` varchar(255) NOT NULL,
	`movement` varchar(255),
	`primaryMuscles` text,
	`plannedPrescription` varchar(100) NOT NULL,
	`plannedRpe` varchar(40),
	`plannedRest` varchar(40),
	`exerciseOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workoutSessionExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`sportId` varchar(80),
	`goal` varchar(80),
	`dayLabel` varchar(100),
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`plannedExerciseCount` int NOT NULL,
	`sessionNotes` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workoutSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutSetLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionExerciseId` int NOT NULL,
	`setNumber` int NOT NULL,
	`actualWeight` decimal(8,2),
	`weightUnit` enum('lb','kg') NOT NULL DEFAULT 'lb',
	`actualReps` int,
	`completed` boolean NOT NULL DEFAULT false,
	`setNotes` varchar(500),
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workoutSetLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `workoutSetLogs_exercise_set_unique` UNIQUE(`sessionExerciseId`,`setNumber`)
);
--> statement-breakpoint
ALTER TABLE `workoutSessionExercises` ADD CONSTRAINT `workoutSessionExercises_sessionId_workoutSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `workoutSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workoutSessions` ADD CONSTRAINT `workoutSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workoutSetLogs` ADD CONSTRAINT `workoutSetLogs_sessionExerciseId_workoutSessionExercises_id_fk` FOREIGN KEY (`sessionExerciseId`) REFERENCES `workoutSessionExercises`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `workoutSessionExercises_session_order_idx` ON `workoutSessionExercises` (`sessionId`,`exerciseOrder`);--> statement-breakpoint
CREATE INDEX `workoutSessions_user_started_idx` ON `workoutSessions` (`userId`,`startedAt`);