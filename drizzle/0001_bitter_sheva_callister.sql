CREATE TABLE `favoriteExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`catalogExerciseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favoriteExercises_id` PRIMARY KEY(`id`),
	CONSTRAINT `favoriteExercises_user_catalog_unique` UNIQUE(`userId`,`catalogExerciseId`)
);
--> statement-breakpoint
ALTER TABLE `favoriteExercises` ADD CONSTRAINT `favoriteExercises_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `favoriteExercises_user_created_idx` ON `favoriteExercises` (`userId`,`createdAt`);