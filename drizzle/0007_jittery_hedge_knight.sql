CREATE TABLE `athleteStrengthPriorities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`regionId` varchar(80) NOT NULL,
	`status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`source` enum('ATHLETE_CONFIRMED') NOT NULL DEFAULT 'ATHLETE_CONFIRMED',
	`note` varchar(280),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `athleteStrengthPriorities_id` PRIMARY KEY(`id`),
	CONSTRAINT `athleteStrengthPriorities_user_region_unique` UNIQUE(`userId`,`regionId`)
);
--> statement-breakpoint
INSERT IGNORE INTO `strengthRegions` (`id`, `label`, `bodyArea`, `description`) VALUES
('shoulders', 'Shoulders', 'Upper body', 'An athlete-facing region informed by multiple shoulder and pressing domains.'),
('chest', 'Chest', 'Upper body', 'An athlete-facing region informed by appropriately mapped pressing domains.'),
('upper_back', 'Upper back', 'Upper body', 'An athlete-facing region informed by appropriately mapped pulling domains.'),
('lats', 'Lats', 'Upper body', 'An athlete-facing region informed by appropriately mapped pulling domains.'),
('biceps', 'Biceps', 'Upper body', 'An athlete-facing region informed by elbow-flexion and related domains.'),
('triceps', 'Triceps', 'Upper body', 'An athlete-facing region informed by elbow-extension and pressing domains.'),
('forearms_grip', 'Forearms / grip', 'Upper body', 'An athlete-facing region informed by grip and wrist domains.'),
('abdominals', 'Abdominals', 'Trunk', 'An athlete-facing region informed by trunk domains.'),
('obliques', 'Obliques', 'Trunk', 'An athlete-facing region informed by rotation and lateral trunk domains.'),
('spinal_erectors', 'Spinal erectors', 'Trunk', 'An athlete-facing region informed by trunk-extension domains.'),
('glutes', 'Glutes', 'Lower body', 'An athlete-facing region informed by hip-extension and related domains.'),
('hip_flexors', 'Hip flexors', 'Lower body', 'An athlete-facing region informed by hip-flexion domains.'),
('hip_adductors', 'Hip adductors', 'Lower body', 'An athlete-facing region informed by hip-adduction domains.'),
('hip_abductors', 'Hip abductors', 'Lower body', 'An athlete-facing region informed by hip-abduction domains.'),
('quadriceps', 'Quadriceps', 'Lower body', 'An athlete-facing region informed by knee-extension domains.'),
('hamstrings', 'Hamstrings', 'Lower body', 'An athlete-facing region informed by knee-flexion and hip-extension domains.'),
('calves', 'Calves', 'Lower body', 'An athlete-facing region informed by plantarflexion domains.'),
('tibialis_anterior', 'Tibialis anterior', 'Lower body', 'An athlete-facing region informed by dorsiflexion domains.');
--> statement-breakpoint
ALTER TABLE `athleteStrengthPriorities` ADD CONSTRAINT `athleteStrengthPriorities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `athleteStrengthPriorities` ADD CONSTRAINT `athleteStrengthPriorities_regionId_strengthRegions_id_fk` FOREIGN KEY (`regionId`) REFERENCES `strengthRegions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `athleteStrengthPriorities_user_status_idx` ON `athleteStrengthPriorities` (`userId`,`status`);
