CREATE TABLE `researchEvidenceNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studyId` int NOT NULL,
	`entryNumber` int NOT NULL,
	`topic` varchar(160) NOT NULL,
	`suppliedUse` text,
	`studyDesignAndPopulation` text,
	`interventionAndComparator` text,
	`primaryOutcomes` text,
	`directResults` text NOT NULL,
	`implementationImplication` text NOT NULL,
	`limitations` text NOT NULL,
	`evidenceTier` varchar(64) NOT NULL,
	`reviewStatus` enum('FULL_TEXT_VERIFIED','ABSTRACT_VERIFIED','RECORD_ONLY') NOT NULL,
	`confidence` enum('high','medium','low') NOT NULL,
	`noteSource` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researchEvidenceNotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `researchEvidenceNotes_entry_unique` UNIQUE(`entryNumber`)
);
--> statement-breakpoint
CREATE TABLE `researchEvidenceRules` (
	`ruleKey` varchar(160) NOT NULL,
	`ruleText` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researchEvidenceRules_ruleKey` PRIMARY KEY(`ruleKey`)
);
--> statement-breakpoint
CREATE TABLE `researchStudies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pmid` varchar(32) NOT NULL,
	`title` text NOT NULL,
	`authorsJson` text NOT NULL,
	`journal` varchar(500),
	`year` varchar(12),
	`volume` varchar(80),
	`issue` varchar(80),
	`pagesOrElocation` varchar(160),
	`doi` varchar(512),
	`pmcid` varchar(32),
	`pubmedUrl` varchar(512) NOT NULL,
	`pmcFullTextUrl` varchar(512),
	`abstract` text,
	`publicationTypesJson` text NOT NULL,
	`meshTermsJson` text NOT NULL,
	`keywordsJson` text NOT NULL,
	`sourceMetadataStatus` varchar(64) NOT NULL,
	`reviewStatus` enum('FULL_TEXT_VERIFIED','ABSTRACT_VERIFIED','RECORD_ONLY') NOT NULL,
	`evidenceTier` varchar(64) NOT NULL,
	`confidence` enum('high','medium','low') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researchStudies_id` PRIMARY KEY(`id`),
	CONSTRAINT `researchStudies_pmid_unique` UNIQUE(`pmid`)
);
--> statement-breakpoint
ALTER TABLE `researchEvidenceNotes` ADD CONSTRAINT `researchEvidenceNotes_studyId_researchStudies_id_fk` FOREIGN KEY (`studyId`) REFERENCES `researchStudies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `researchEvidenceNotes_study_idx` ON `researchEvidenceNotes` (`studyId`);--> statement-breakpoint
CREATE INDEX `researchEvidenceNotes_topic_idx` ON `researchEvidenceNotes` (`topic`);--> statement-breakpoint
CREATE INDEX `researchStudies_review_status_idx` ON `researchStudies` (`reviewStatus`);--> statement-breakpoint
CREATE INDEX `researchStudies_evidence_tier_idx` ON `researchStudies` (`evidenceTier`);