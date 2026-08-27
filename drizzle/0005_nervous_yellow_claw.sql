CREATE TABLE `athleteStrengthProfiles` (
	`userId` int NOT NULL,
	`dateOfBirth` date,
	`sexForReference` enum('female','male','intersex','unspecified') NOT NULL DEFAULT 'unspecified',
	`heightCm` decimal(6,2),
	`trainingAgeYears` decimal(5,2),
	`strengthTrainingAgeYears` decimal(5,2),
	`maturityStatus` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `athleteStrengthProfiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `bodyMassObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bodyMassKg` decimal(6,2) NOT NULL,
	`observedAt` timestamp NOT NULL,
	`source` enum('athlete_entry','workout_import') NOT NULL DEFAULT 'athlete_entry',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bodyMassObservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strengthDomainRegionMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domainId` varchar(80) NOT NULL,
	`regionId` varchar(80) NOT NULL,
	`contributionWeight` decimal(5,4),
	`evidenceGrade` enum('A','B','C','D','INFERRED') NOT NULL DEFAULT 'INFERRED',
	`sourceIdsJson` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strengthDomainRegionMappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `strengthDomainRegionMappings_domain_region_unique` UNIQUE(`domainId`,`regionId`)
);
--> statement-breakpoint
CREATE TABLE `strengthDomains` (
	`id` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`group` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`sourceStatus` enum('AWAITING_EVIDENCE','REFERENCE_SUPPORTED') NOT NULL DEFAULT 'AWAITING_EVIDENCE',
	`sourceIdsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strengthDomains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strengthEstimateSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scope` enum('DOMAIN','REGION') NOT NULL,
	`targetId` varchar(80) NOT NULL,
	`sourceStatus` enum('OBSERVATION_ONLY','INFERRED_PENDING_EVIDENCE','REFERENCE_SUPPORTED','INSUFFICIENT_DATA') NOT NULL,
	`continuousStrengthScore` decimal(8,3),
	`estimatedPercentile` decimal(5,2),
	`tier` varchar(8),
	`certaintyScore` decimal(5,2),
	`certaintyLabel` enum('VERY_LOW','LOW','MODERATE','HIGH','VERY_HIGH'),
	`effectiveEvidenceCount` decimal(6,2),
	`independentMovementCount` int,
	`observationCount` int NOT NULL DEFAULT 0,
	`agreementScore` decimal(5,2),
	`referenceQuality` enum('A','B','C','D'),
	`normativeReferenceId` int,
	`modelVersion` varchar(80) NOT NULL,
	`explanationJson` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strengthEstimateSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strengthExerciseDomainMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogExerciseId` int NOT NULL,
	`domainId` varchar(80) NOT NULL,
	`independenceGroup` varchar(120) NOT NULL,
	`contributionWeight` decimal(5,4),
	`specificityWeight` decimal(5,4),
	`measurementQualityWeight` decimal(5,4),
	`evidenceGrade` enum('A','B','C','D','INFERRED') NOT NULL DEFAULT 'INFERRED',
	`sourceIdsJson` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strengthExerciseDomainMappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `strengthExerciseDomainMappings_exercise_domain_unique` UNIQUE(`catalogExerciseId`,`domainId`)
);
--> statement-breakpoint
CREATE TABLE `strengthNormativeReferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogExerciseId` int,
	`measurementType` varchar(80) NOT NULL,
	`protocolLabel` varchar(255) NOT NULL,
	`populationType` varchar(160) NOT NULL,
	`sexForReference` enum('female','male','mixed','unspecified') NOT NULL DEFAULT 'unspecified',
	`ageMin` int,
	`ageMax` int,
	`trainingStatus` varchar(160),
	`sportId` varchar(80),
	`positionOrEvent` varchar(160),
	`bodyMassMinKg` decimal(6,2),
	`bodyMassMaxKg` decimal(6,2),
	`normalizationMethod` varchar(160) NOT NULL,
	`p01` decimal(8,3),
	`p05` decimal(8,3),
	`p10` decimal(8,3),
	`p25` decimal(8,3),
	`p50` decimal(8,3),
	`p75` decimal(8,3),
	`p90` decimal(8,3),
	`p95` decimal(8,3),
	`p99` decimal(8,3),
	`sampleSize` int,
	`sourceStudyId` int,
	`sourceUrl` varchar(512),
	`qualityGrade` enum('A','B','C','D'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strengthNormativeReferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strengthObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`catalogExerciseId` int,
	`exerciseName` varchar(255) NOT NULL,
	`observedAt` timestamp NOT NULL,
	`measurementType` enum('MEASURED_1RM','MULTI_REP','BODYWEIGHT','ISOMETRIC','DYNAMOMETRY','JUMP','FORCE_PLATE','VELOCITY') NOT NULL,
	`loadKg` decimal(8,2),
	`repetitions` int,
	`measuredOneRmKg` decimal(8,2),
	`estimatedOneRmKg` decimal(8,2),
	`estimationMethod` varchar(120),
	`estimatedErrorPercent` decimal(5,2),
	`bodyMassKgAtTest` decimal(6,2),
	`totalSystemLoadKg` decimal(8,2),
	`rpe` decimal(3,1),
	`rir` decimal(3,1),
	`equipment` varchar(120),
	`romStandard` varchar(255),
	`techniqueVariant` varchar(255),
	`tempo` varchar(80),
	`laterality` enum('BILATERAL','LEFT','RIGHT') NOT NULL DEFAULT 'BILATERAL',
	`externalAssistance` varchar(255),
	`dataQuality` enum('SELF_REPORTED','STANDARDIZED','VERIFIED','UNCERTAIN') NOT NULL DEFAULT 'SELF_REPORTED',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strengthObservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strengthRegions` (
	`id` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`bodyArea` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strengthRegions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `athleteStrengthProfiles` ADD CONSTRAINT `athleteStrengthProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bodyMassObservations` ADD CONSTRAINT `bodyMassObservations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strengthDomainRegionMappings` ADD CONSTRAINT `strengthDomainRegionMappings_domainId_strengthDomains_id_fk` FOREIGN KEY (`domainId`) REFERENCES `strengthDomains`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strengthDomainRegionMappings` ADD CONSTRAINT `strengthDomainRegionMappings_regionId_strengthRegions_id_fk` FOREIGN KEY (`regionId`) REFERENCES `strengthRegions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strengthEstimateSnapshots` ADD CONSTRAINT `strengthEstimateSnapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strengthEstimateSnapshots` ADD CONSTRAINT `strengthEstimateSnapshots_reference_fk` FOREIGN KEY (`normativeReferenceId`) REFERENCES `strengthNormativeReferences`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strengthExerciseDomainMappings` ADD CONSTRAINT `strengthExerciseDomainMappings_domainId_strengthDomains_id_fk` FOREIGN KEY (`domainId`) REFERENCES `strengthDomains`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strengthNormativeReferences` ADD CONSTRAINT `strengthNormativeReferences_sourceStudyId_researchStudies_id_fk` FOREIGN KEY (`sourceStudyId`) REFERENCES `researchStudies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strengthObservations` ADD CONSTRAINT `strengthObservations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bodyMassObservations_user_date_idx` ON `bodyMassObservations` (`userId`,`observedAt`);--> statement-breakpoint
CREATE INDEX `strengthDomainRegionMappings_region_idx` ON `strengthDomainRegionMappings` (`regionId`);--> statement-breakpoint
CREATE INDEX `strengthEstimateSnapshots_user_target_date_idx` ON `strengthEstimateSnapshots` (`userId`,`targetId`,`calculatedAt`);--> statement-breakpoint
CREATE INDEX `strengthExerciseDomainMappings_domain_idx` ON `strengthExerciseDomainMappings` (`domainId`);--> statement-breakpoint
CREATE INDEX `strengthNormativeReferences_exercise_idx` ON `strengthNormativeReferences` (`catalogExerciseId`);--> statement-breakpoint
CREATE INDEX `strengthNormativeReferences_sport_idx` ON `strengthNormativeReferences` (`sportId`);--> statement-breakpoint
CREATE INDEX `strengthObservations_user_date_idx` ON `strengthObservations` (`userId`,`observedAt`);--> statement-breakpoint
CREATE INDEX `strengthObservations_user_exercise_idx` ON `strengthObservations` (`userId`,`catalogExerciseId`);
