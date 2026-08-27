import {
  boolean,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workoutSessions = mysqlTable(
  "workoutSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    sportId: varchar("sportId", { length: 80 }),
    goal: varchar("goal", { length: 80 }),
    dayLabel: varchar("dayLabel", { length: 100 }),
    status: mysqlEnum("status", ["active", "completed", "abandoned"])
      .notNull()
      .default("active"),
    plannedExerciseCount: int("plannedExerciseCount").notNull(),
    sessionNotes: text("sessionNotes"),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("workoutSessions_user_started_idx").on(table.userId, table.startedAt),
  ]
);

export const workoutSessionExercises = mysqlTable(
  "workoutSessionExercises",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    catalogExerciseId: int("catalogExerciseId"),
    exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
    movement: varchar("movement", { length: 255 }),
    primaryMuscles: text("primaryMuscles"),
    plannedPrescription: varchar("plannedPrescription", {
      length: 100,
    }).notNull(),
    plannedRpe: varchar("plannedRpe", { length: 40 }),
    plannedRest: varchar("plannedRest", { length: 40 }),
    exerciseOrder: int("exerciseOrder").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("workoutSessionExercises_session_order_idx").on(
      table.sessionId,
      table.exerciseOrder
    ),
  ]
);

export const workoutSetLogs = mysqlTable(
  "workoutSetLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionExerciseId: int("sessionExerciseId")
      .notNull()
      .references(() => workoutSessionExercises.id, { onDelete: "cascade" }),
    setNumber: int("setNumber").notNull(),
    actualWeight: decimal("actualWeight", { precision: 8, scale: 2 }),
    weightUnit: mysqlEnum("weightUnit", ["lb", "kg"]).notNull().default("lb"),
    actualReps: int("actualReps"),
    actualRpe: decimal("actualRpe", { precision: 3, scale: 1 }),
    completed: boolean("completed").notNull().default(false),
    setNotes: varchar("setNotes", { length: 500 }),
    loggedAt: timestamp("loggedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("workoutSetLogs_exercise_set_unique").on(
      table.sessionExerciseId,
      table.setNumber
    ),
  ]
);

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type WorkoutSessionExercise =
  typeof workoutSessionExercises.$inferSelect;
export type WorkoutSetLog = typeof workoutSetLogs.$inferSelect;

/** Account-owned bookmarks for static exercise-catalog records. */
export const favoriteExercises = mysqlTable(
  "favoriteExercises",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    catalogExerciseId: int("catalogExerciseId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("favoriteExercises_user_catalog_unique").on(
      table.userId,
      table.catalogExerciseId
    ),
    index("favoriteExercises_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
);

export type FavoriteExercise = typeof favoriteExercises.$inferSelect;

/** Standalone Gym Optimizer email credentials; password hashes are never exposed to clients. */
export const emailCredentials = mysqlTable(
  "emailCredentials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: varchar("passwordHash", { length: 128 }).notNull(),
    passwordSalt: varchar("passwordSalt", { length: 64 }).notNull(),
    failedAttempts: int("failedAttempts").notNull().default(0),
    lockedUntil: timestamp("lockedUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("emailCredentials_email_unique").on(table.email),
    uniqueIndex("emailCredentials_user_unique").on(table.userId),
  ]
);

/** Opaque, hashed local session tokens for standalone email and passkey accounts. */
export const localAuthSessions = mysqlTable(
  "localAuthSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("localAuthSessions_token_unique").on(table.tokenHash),
    index("localAuthSessions_user_expiry_idx").on(
      table.userId,
      table.expiresAt
    ),
  ]
);

/** WebAuthn credentials used by Face ID / device passkeys on supported platforms. */
export const accountPasskeys = mysqlTable(
  "accountPasskeys",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: varchar("credentialId", { length: 512 }).notNull(),
    publicKey: text("publicKey").notNull(),
    counter: int("counter").notNull().default(0),
    transports: varchar("transports", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastUsedAt: timestamp("lastUsedAt"),
  },
  table => [
    uniqueIndex("accountPasskeys_credential_unique").on(table.credentialId),
    index("accountPasskeys_user_idx").on(table.userId),
  ]
);

/** One-time WebAuthn ceremony challenges, automatically expired and deleted after use. */
export const localAuthChallenges = mysqlTable(
  "localAuthChallenges",
  {
    id: int("id").autoincrement().primaryKey(),
    identifier: varchar("identifier", { length: 320 }).notNull(),
    challenge: varchar("challenge", { length: 512 }).notNull(),
    purpose: mysqlEnum("purpose", ["register", "authenticate"]).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("localAuthChallenges_identifier_purpose_idx").on(
      table.identifier,
      table.purpose,
      table.expiresAt
    ),
  ]
);

/**
 * Verified research sources supporting transparent exercise and program evidence.
 * `reviewStatus` is intentionally preserved so abstract-only and citation-only records
 * cannot be represented as full-paper findings.
 */
export const researchStudies = mysqlTable(
  "researchStudies",
  {
    id: int("id").autoincrement().primaryKey(),
    pmid: varchar("pmid", { length: 32 }).notNull(),
    title: text("title").notNull(),
    authorsJson: text("authorsJson").notNull(),
    journal: varchar("journal", { length: 500 }),
    year: varchar("year", { length: 12 }),
    volume: varchar("volume", { length: 80 }),
    issue: varchar("issue", { length: 80 }),
    pagesOrElocation: varchar("pagesOrElocation", { length: 160 }),
    doi: varchar("doi", { length: 512 }),
    pmcid: varchar("pmcid", { length: 32 }),
    pubmedUrl: varchar("pubmedUrl", { length: 512 }).notNull(),
    pmcFullTextUrl: varchar("pmcFullTextUrl", { length: 512 }),
    abstract: text("abstract"),
    publicationTypesJson: text("publicationTypesJson").notNull(),
    meshTermsJson: text("meshTermsJson").notNull(),
    keywordsJson: text("keywordsJson").notNull(),
    sourceMetadataStatus: varchar("sourceMetadataStatus", {
      length: 64,
    }).notNull(),
    reviewStatus: mysqlEnum("reviewStatus", [
      "FULL_TEXT_VERIFIED",
      "ABSTRACT_VERIFIED",
      "RECORD_ONLY",
    ]).notNull(),
    evidenceTier: varchar("evidenceTier", { length: 64 }).notNull(),
    confidence: mysqlEnum("confidence", ["high", "medium", "low"]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("researchStudies_pmid_unique").on(table.pmid),
    index("researchStudies_review_status_idx").on(table.reviewStatus),
    index("researchStudies_evidence_tier_idx").on(table.evidenceTier),
  ]
);

/** Bounded interpretation layer tied to a canonical research study. */
export const researchEvidenceNotes = mysqlTable(
  "researchEvidenceNotes",
  {
    id: int("id").autoincrement().primaryKey(),
    studyId: int("studyId")
      .notNull()
      .references(() => researchStudies.id, { onDelete: "cascade" }),
    entryNumber: int("entryNumber").notNull(),
    topic: varchar("topic", { length: 160 }).notNull(),
    suppliedUse: text("suppliedUse"),
    studyDesignAndPopulation: text("studyDesignAndPopulation"),
    interventionAndComparator: text("interventionAndComparator"),
    primaryOutcomes: text("primaryOutcomes"),
    directResults: text("directResults").notNull(),
    implementationImplication: text("implementationImplication").notNull(),
    limitations: text("limitations").notNull(),
    evidenceTier: varchar("evidenceTier", { length: 64 }).notNull(),
    reviewStatus: mysqlEnum("reviewStatus", [
      "FULL_TEXT_VERIFIED",
      "ABSTRACT_VERIFIED",
      "RECORD_ONLY",
    ]).notNull(),
    confidence: mysqlEnum("confidence", ["high", "medium", "low"]).notNull(),
    noteSource: text("noteSource").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("researchEvidenceNotes_entry_unique").on(table.entryNumber),
    index("researchEvidenceNotes_study_idx").on(table.studyId),
    index("researchEvidenceNotes_topic_idx").on(table.topic),
  ]
);

/** Non-negotiable reasoning constraints that govern the evidence layer. */
export const researchEvidenceRules = mysqlTable("researchEvidenceRules", {
  ruleKey: varchar("ruleKey", { length: 160 }).primaryKey(),
  ruleText: text("ruleText").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Optional reference-matching context; body mass itself stays in dated observations. */
export const athleteStrengthProfiles = mysqlTable(
  "athleteStrengthProfiles",
  {
    userId: int("userId")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    dateOfBirth: date("dateOfBirth"),
    sexForReference: mysqlEnum("sexForReference", [
      "female",
      "male",
      "intersex",
      "unspecified",
    ]).notNull().default("unspecified"),
    heightCm: decimal("heightCm", { precision: 6, scale: 2 }),
    trainingAgeYears: decimal("trainingAgeYears", { precision: 5, scale: 2 }),
    strengthTrainingAgeYears: decimal("strengthTrainingAgeYears", {
      precision: 5,
      scale: 2,
    }),
    maturityStatus: varchar("maturityStatus", { length: 80 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

/** Dated body mass records support historical relative-strength interpretation. */
export const bodyMassObservations = mysqlTable(
  "bodyMassObservations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bodyMassKg: decimal("bodyMassKg", { precision: 6, scale: 2 }).notNull(),
    observedAt: timestamp("observedAt").notNull(),
    source: mysqlEnum("source", ["athlete_entry", "workout_import"])
      .notNull()
      .default("athlete_entry"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("bodyMassObservations_user_date_idx").on(table.userId, table.observedAt)]
);

/** Functional domains are independent of anatomical presentation regions. */
export const strengthDomains = mysqlTable("strengthDomains", {
  id: varchar("id", { length: 80 }).primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  group: varchar("group", { length: 80 }).notNull(),
  description: text("description").notNull(),
  sourceStatus: mysqlEnum("sourceStatus", [
    "AWAITING_EVIDENCE",
    "REFERENCE_SUPPORTED",
  ])
    .notNull()
    .default("AWAITING_EVIDENCE"),
  sourceIdsJson: text("sourceIdsJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Athlete-facing anatomical presentation regions; not direct muscle-force measurements. */
export const strengthRegions = mysqlTable("strengthRegions", {
  id: varchar("id", { length: 80 }).primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  bodyArea: varchar("bodyArea", { length: 80 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A dated athlete-entered performance observation with retained testing context. */
export const strengthObservations = mysqlTable(
  "strengthObservations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    catalogExerciseId: int("catalogExerciseId"),
    exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
    observedAt: timestamp("observedAt").notNull(),
    measurementType: mysqlEnum("measurementType", [
      "MEASURED_1RM",
      "MULTI_REP",
      "BODYWEIGHT",
      "ISOMETRIC",
      "DYNAMOMETRY",
      "JUMP",
      "FORCE_PLATE",
      "VELOCITY",
    ]).notNull(),
    loadKg: decimal("loadKg", { precision: 8, scale: 2 }),
    repetitions: int("repetitions"),
    measuredOneRmKg: decimal("measuredOneRmKg", { precision: 8, scale: 2 }),
    estimatedOneRmKg: decimal("estimatedOneRmKg", { precision: 8, scale: 2 }),
    estimationMethod: varchar("estimationMethod", { length: 120 }),
    estimatedErrorPercent: decimal("estimatedErrorPercent", {
      precision: 5,
      scale: 2,
    }),
    bodyMassKgAtTest: decimal("bodyMassKgAtTest", { precision: 6, scale: 2 }),
    totalSystemLoadKg: decimal("totalSystemLoadKg", { precision: 8, scale: 2 }),
    rpe: decimal("rpe", { precision: 3, scale: 1 }),
    rir: decimal("rir", { precision: 3, scale: 1 }),
    equipment: varchar("equipment", { length: 120 }),
    romStandard: varchar("romStandard", { length: 255 }),
    techniqueVariant: varchar("techniqueVariant", { length: 255 }),
    tempo: varchar("tempo", { length: 80 }),
    laterality: mysqlEnum("laterality", ["BILATERAL", "LEFT", "RIGHT"])
      .notNull()
      .default("BILATERAL"),
    externalAssistance: varchar("externalAssistance", { length: 255 }),
    dataQuality: mysqlEnum("dataQuality", [
      "SELF_REPORTED",
      "STANDARDIZED",
      "VERIFIED",
      "UNCERTAIN",
    ])
      .notNull()
      .default("SELF_REPORTED"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("strengthObservations_user_date_idx").on(table.userId, table.observedAt),
    index("strengthObservations_user_exercise_idx").on(table.userId, table.catalogExerciseId),
  ]
);

/** Source-traceable route from a standardized exercise observation to functional domains. */
export const strengthExerciseDomainMappings = mysqlTable(
  "strengthExerciseDomainMappings",
  {
    id: int("id").autoincrement().primaryKey(),
    catalogExerciseId: int("catalogExerciseId").notNull(),
    domainId: varchar("domainId", { length: 80 })
      .notNull()
      .references(() => strengthDomains.id, { onDelete: "cascade" }),
    independenceGroup: varchar("independenceGroup", { length: 120 }).notNull(),
    contributionWeight: decimal("contributionWeight", { precision: 5, scale: 4 }),
    specificityWeight: decimal("specificityWeight", { precision: 5, scale: 4 }),
    measurementQualityWeight: decimal("measurementQualityWeight", {
      precision: 5,
      scale: 4,
    }),
    evidenceGrade: mysqlEnum("evidenceGrade", ["A", "B", "C", "D", "INFERRED"])
      .notNull()
      .default("INFERRED"),
    sourceIdsJson: text("sourceIdsJson"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("strengthExerciseDomainMappings_exercise_domain_unique").on(
      table.catalogExerciseId,
      table.domainId
    ),
    index("strengthExerciseDomainMappings_domain_idx").on(table.domainId),
  ]
);

/** Source-traceable aggregation from functional domains to anatomical presentation regions. */
export const strengthDomainRegionMappings = mysqlTable(
  "strengthDomainRegionMappings",
  {
    id: int("id").autoincrement().primaryKey(),
    domainId: varchar("domainId", { length: 80 })
      .notNull()
      .references(() => strengthDomains.id, { onDelete: "cascade" }),
    regionId: varchar("regionId", { length: 80 })
      .notNull()
      .references(() => strengthRegions.id, { onDelete: "cascade" }),
    contributionWeight: decimal("contributionWeight", { precision: 5, scale: 4 }),
    evidenceGrade: mysqlEnum("evidenceGrade", ["A", "B", "C", "D", "INFERRED"])
      .notNull()
      .default("INFERRED"),
    sourceIdsJson: text("sourceIdsJson"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("strengthDomainRegionMappings_domain_region_unique").on(
      table.domainId,
      table.regionId
    ),
    index("strengthDomainRegionMappings_region_idx").on(table.regionId),
  ]
);

/** Normative evidence is stored only with its population and normalization scope. */
export const strengthNormativeReferences = mysqlTable(
  "strengthNormativeReferences",
  {
    id: int("id").autoincrement().primaryKey(),
    catalogExerciseId: int("catalogExerciseId"),
    measurementType: varchar("measurementType", { length: 80 }).notNull(),
    protocolLabel: varchar("protocolLabel", { length: 255 }).notNull(),
    populationType: varchar("populationType", { length: 160 }).notNull(),
    sexForReference: mysqlEnum("sexForReference", [
      "female",
      "male",
      "mixed",
      "unspecified",
    ])
      .notNull()
      .default("unspecified"),
    ageMin: int("ageMin"),
    ageMax: int("ageMax"),
    trainingStatus: varchar("trainingStatus", { length: 160 }),
    sportId: varchar("sportId", { length: 80 }),
    positionOrEvent: varchar("positionOrEvent", { length: 160 }),
    bodyMassMinKg: decimal("bodyMassMinKg", { precision: 6, scale: 2 }),
    bodyMassMaxKg: decimal("bodyMassMaxKg", { precision: 6, scale: 2 }),
    normalizationMethod: varchar("normalizationMethod", { length: 160 }).notNull(),
    p01: decimal("p01", { precision: 8, scale: 3 }),
    p05: decimal("p05", { precision: 8, scale: 3 }),
    p10: decimal("p10", { precision: 8, scale: 3 }),
    p25: decimal("p25", { precision: 8, scale: 3 }),
    p50: decimal("p50", { precision: 8, scale: 3 }),
    p75: decimal("p75", { precision: 8, scale: 3 }),
    p90: decimal("p90", { precision: 8, scale: 3 }),
    p95: decimal("p95", { precision: 8, scale: 3 }),
    p99: decimal("p99", { precision: 8, scale: 3 }),
    sampleSize: int("sampleSize"),
    sourceStudyId: int("sourceStudyId").references(() => researchStudies.id, {
      onDelete: "set null",
    }),
    sourceUrl: varchar("sourceUrl", { length: 512 }),
    qualityGrade: mysqlEnum("qualityGrade", ["A", "B", "C", "D"]),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("strengthNormativeReferences_exercise_idx").on(table.catalogExerciseId),
    index("strengthNormativeReferences_sport_idx").on(table.sportId),
  ]
);

/** Immutable estimate history. A current view selects the latest compatible snapshot. */
export const strengthEstimateSnapshots = mysqlTable(
  "strengthEstimateSnapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: mysqlEnum("scope", ["DOMAIN", "REGION"]).notNull(),
    targetId: varchar("targetId", { length: 80 }).notNull(),
    sourceStatus: mysqlEnum("sourceStatus", [
      "OBSERVATION_ONLY",
      "INFERRED_PENDING_EVIDENCE",
      "REFERENCE_SUPPORTED",
      "INSUFFICIENT_DATA",
    ]).notNull(),
    continuousStrengthScore: decimal("continuousStrengthScore", {
      precision: 8,
      scale: 3,
    }),
    estimatedPercentile: decimal("estimatedPercentile", {
      precision: 5,
      scale: 2,
    }),
    tier: varchar("tier", { length: 8 }),
    certaintyScore: decimal("certaintyScore", { precision: 5, scale: 2 }),
    certaintyLabel: mysqlEnum("certaintyLabel", [
      "VERY_LOW",
      "LOW",
      "MODERATE",
      "HIGH",
      "VERY_HIGH",
    ]),
    effectiveEvidenceCount: decimal("effectiveEvidenceCount", {
      precision: 6,
      scale: 2,
    }),
    independentMovementCount: int("independentMovementCount"),
    observationCount: int("observationCount").notNull().default(0),
    agreementScore: decimal("agreementScore", { precision: 5, scale: 2 }),
    referenceQuality: mysqlEnum("referenceQuality", ["A", "B", "C", "D"]),
    normativeReferenceId: int("normativeReferenceId"),
    modelVersion: varchar("modelVersion", { length: 80 }).notNull(),
    explanationJson: text("explanationJson"),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  },
  table => [
    index("strengthEstimateSnapshots_user_target_date_idx").on(
      table.userId,
      table.targetId,
      table.calculatedAt
    ),
    foreignKey({
      columns: [table.normativeReferenceId],
      foreignColumns: [strengthNormativeReferences.id],
      name: "strengthEstimateSnapshots_reference_fk",
    }).onDelete("set null"),
  ]
);

export type AthleteStrengthProfile = typeof athleteStrengthProfiles.$inferSelect;
export type BodyMassObservation = typeof bodyMassObservations.$inferSelect;
export type StrengthObservation = typeof strengthObservations.$inferSelect;
export type StrengthEstimateSnapshot = typeof strengthEstimateSnapshots.$inferSelect;

export type EmailCredential = typeof emailCredentials.$inferSelect;
export type LocalAuthSession = typeof localAuthSessions.$inferSelect;
export type AccountPasskey = typeof accountPasskeys.$inferSelect;
export type ResearchStudy = typeof researchStudies.$inferSelect;
export type ResearchEvidenceNote = typeof researchEvidenceNotes.$inferSelect;
export type ResearchEvidenceRule = typeof researchEvidenceRules.$inferSelect;
