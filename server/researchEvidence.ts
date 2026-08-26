import { asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  researchEvidenceNotes,
  researchEvidenceRules,
  researchStudies,
} from "../drizzle/schema";
import {
  evidenceModelRules,
  evidenceSeedRecords,
  type EvidenceReviewStatus,
} from "./researchEvidenceSeed";

export type EvidenceLibrarySummary = {
  available: boolean;
  totalStudies: number;
  fullTextVerified: number;
  abstractVerified: number;
  recordOnly: number;
  recommendationEligible: number;
  rules: number;
};

export type ResearchEvidenceRecord = {
  entryNumber: number;
  topic: string;
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  pmcid: string;
  pubmedUrl: string;
  pmcFullTextUrl: string;
  abstract: string;
  publicationTypes: string[];
  meshTerms: string[];
  keywords: string[];
  sourceMetadataStatus: string;
  reviewStatus: EvidenceReviewStatus;
  evidenceTier: string;
  confidence: "high" | "medium" | "low";
  suppliedUse: string;
  studyDesignAndPopulation: string;
  interventionAndComparator: string;
  primaryOutcomes: string | null;
  directResults: string;
  implementationImplication: string;
  limitations: string;
  noteSource: string;
  recommendationEligible: boolean;
};

let seedPromise: Promise<void> | null = null;

function jsonString(values: readonly string[]) {
  return JSON.stringify(values);
}

function asStringArray(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function optionalEvidenceText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

/**
 * Inserts or refreshes all verified sources without duplication. The import is
 * intentionally idempotent so a deployment retry cannot create duplicate PMIDs
 * or evidence notes. It is invoked only by the evidence-library endpoints.
 */
export async function ensureResearchEvidenceSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const db = await getDb();
    if (!db) return;

    for (const record of evidenceSeedRecords) {
      const study = record.study;
      await db
        .insert(researchStudies)
        .values({
          pmid: study.pmid,
          title: study.title,
          authorsJson: jsonString(study.authors),
          journal: study.journal || null,
          year: study.year || null,
          volume: study.volume || null,
          issue: study.issue || null,
          pagesOrElocation: study.pagesOrElocation || null,
          doi: study.doi || null,
          pmcid: study.pmcid || null,
          pubmedUrl: study.pubmedUrl,
          pmcFullTextUrl: study.pmcFullTextUrl || null,
          abstract: study.abstract || null,
          publicationTypesJson: jsonString(study.publicationTypes),
          meshTermsJson: jsonString(study.meshTerms),
          keywordsJson: jsonString(study.keywords),
          sourceMetadataStatus: study.sourceMetadataStatus,
          reviewStatus: study.reviewStatus,
          evidenceTier: study.evidenceTier,
          confidence: study.confidence as "high" | "medium" | "low",
        })
        .onDuplicateKeyUpdate({
          set: {
            title: study.title,
            authorsJson: jsonString(study.authors),
            journal: study.journal || null,
            year: study.year || null,
            volume: study.volume || null,
            issue: study.issue || null,
            pagesOrElocation: study.pagesOrElocation || null,
            doi: study.doi || null,
            pmcid: study.pmcid || null,
            pubmedUrl: study.pubmedUrl,
            pmcFullTextUrl: study.pmcFullTextUrl || null,
            abstract: study.abstract || null,
            publicationTypesJson: jsonString(study.publicationTypes),
            meshTermsJson: jsonString(study.meshTerms),
            keywordsJson: jsonString(study.keywords),
            sourceMetadataStatus: study.sourceMetadataStatus,
            reviewStatus: study.reviewStatus,
            evidenceTier: study.evidenceTier,
            confidence: study.confidence as "high" | "medium" | "low",
            updatedAt: new Date(),
          },
        });
    }

    const storedStudies = await db
      .select({ id: researchStudies.id, pmid: researchStudies.pmid })
      .from(researchStudies);
    const studyIds = new Map(
      storedStudies.map(study => [study.pmid, study.id])
    );

    for (const record of evidenceSeedRecords) {
      const studyId = studyIds.get(record.study.pmid);
      if (!studyId)
        throw new Error(
          `Evidence seed integrity failure: PMID ${record.study.pmid} was not persisted.`
        );
      const note = record.note;
      await db
        .insert(researchEvidenceNotes)
        .values({
          studyId,
          entryNumber: note.entryNumber,
          topic: note.topic,
          suppliedUse: note.suppliedUse || null,
          studyDesignAndPopulation: note.studyDesignAndPopulation || null,
          interventionAndComparator: note.interventionAndComparator || null,
          primaryOutcomes: note.primaryOutcomes || null,
          directResults: note.directResults,
          implementationImplication: note.implementationImplication,
          limitations: note.limitations,
          evidenceTier: note.evidenceTier,
          reviewStatus: note.reviewStatus,
          confidence: note.confidence as "high" | "medium" | "low",
          noteSource: note.noteSource,
        })
        .onDuplicateKeyUpdate({
          set: {
            studyId,
            topic: note.topic,
            suppliedUse: note.suppliedUse || null,
            studyDesignAndPopulation: note.studyDesignAndPopulation || null,
            interventionAndComparator: note.interventionAndComparator || null,
            primaryOutcomes: note.primaryOutcomes || null,
            directResults: note.directResults,
            implementationImplication: note.implementationImplication,
            limitations: note.limitations,
            evidenceTier: note.evidenceTier,
            reviewStatus: note.reviewStatus,
            confidence: note.confidence as "high" | "medium" | "low",
            noteSource: note.noteSource,
            updatedAt: new Date(),
          },
        });
    }

    for (const rule of evidenceModelRules) {
      await db
        .insert(researchEvidenceRules)
        .values({ ruleKey: rule.ruleKey, ruleText: rule.ruleText })
        .onDuplicateKeyUpdate({
          set: { ruleText: rule.ruleText, updatedAt: new Date() },
        });
    }
  })().catch(error => {
    seedPromise = null;
    throw error;
  });
  return seedPromise;
}

async function getStoredEvidenceRows() {
  const db = await getDb();
  if (!db) return null;
  await ensureResearchEvidenceSeeded();
  return db
    .select({
      entryNumber: researchEvidenceNotes.entryNumber,
      topic: researchEvidenceNotes.topic,
      suppliedUse: researchEvidenceNotes.suppliedUse,
      studyDesignAndPopulation: researchEvidenceNotes.studyDesignAndPopulation,
      interventionAndComparator:
        researchEvidenceNotes.interventionAndComparator,
      primaryOutcomes: researchEvidenceNotes.primaryOutcomes,
      directResults: researchEvidenceNotes.directResults,
      implementationImplication:
        researchEvidenceNotes.implementationImplication,
      limitations: researchEvidenceNotes.limitations,
      noteSource: researchEvidenceNotes.noteSource,
      pmid: researchStudies.pmid,
      title: researchStudies.title,
      authorsJson: researchStudies.authorsJson,
      journal: researchStudies.journal,
      year: researchStudies.year,
      doi: researchStudies.doi,
      pmcid: researchStudies.pmcid,
      pubmedUrl: researchStudies.pubmedUrl,
      pmcFullTextUrl: researchStudies.pmcFullTextUrl,
      abstract: researchStudies.abstract,
      publicationTypesJson: researchStudies.publicationTypesJson,
      meshTermsJson: researchStudies.meshTermsJson,
      keywordsJson: researchStudies.keywordsJson,
      sourceMetadataStatus: researchStudies.sourceMetadataStatus,
      reviewStatus: researchStudies.reviewStatus,
      evidenceTier: researchStudies.evidenceTier,
      confidence: researchStudies.confidence,
    })
    .from(researchEvidenceNotes)
    .innerJoin(
      researchStudies,
      eq(researchEvidenceNotes.studyId, researchStudies.id)
    )
    .orderBy(asc(researchEvidenceNotes.entryNumber));
}

function serializeEvidenceRow(
  row: Awaited<ReturnType<typeof getStoredEvidenceRows>> extends
    | (infer T)[]
    | null
    ? T
    : never
): ResearchEvidenceRecord {
  const reviewStatus = row.reviewStatus as EvidenceReviewStatus;
  return {
    entryNumber: row.entryNumber,
    topic: row.topic,
    pmid: row.pmid,
    title: row.title,
    authors: asStringArray(row.authorsJson),
    journal: row.journal || "",
    year: row.year || "",
    doi: row.doi || "",
    pmcid: row.pmcid || "",
    pubmedUrl: row.pubmedUrl,
    pmcFullTextUrl: row.pmcFullTextUrl || "",
    abstract: row.abstract || "",
    publicationTypes: asStringArray(row.publicationTypesJson),
    meshTerms: asStringArray(row.meshTermsJson),
    keywords: asStringArray(row.keywordsJson),
    sourceMetadataStatus: row.sourceMetadataStatus,
    reviewStatus,
    evidenceTier: row.evidenceTier,
    confidence: row.confidence as "high" | "medium" | "low",
    suppliedUse: row.suppliedUse || "",
    studyDesignAndPopulation: row.studyDesignAndPopulation || "",
    interventionAndComparator: row.interventionAndComparator || "",
    primaryOutcomes: optionalEvidenceText(row.primaryOutcomes),
    directResults: row.directResults,
    implementationImplication: row.implementationImplication,
    limitations: row.limitations,
    noteSource: row.noteSource,
    recommendationEligible: reviewStatus !== "RECORD_ONLY",
  };
}

export async function getResearchEvidenceLibrary(): Promise<
  ResearchEvidenceRecord[]
> {
  const rows = await getStoredEvidenceRows();
  return rows ? rows.map(row => serializeEvidenceRow(row)) : [];
}

export async function getResearchEvidenceByPmid(
  pmid: string
): Promise<ResearchEvidenceRecord | null> {
  const records = await getResearchEvidenceLibrary();
  return records.find(record => record.pmid === pmid) || null;
}

export async function getEvidenceLibrarySummary(): Promise<EvidenceLibrarySummary> {
  const records = await getResearchEvidenceLibrary();
  if (!records.length)
    return {
      available: false,
      totalStudies: 0,
      fullTextVerified: 0,
      abstractVerified: 0,
      recordOnly: 0,
      recommendationEligible: 0,
      rules: 0,
    };
  const db = await getDb();
  const rules = db
    ? await db
        .select({ ruleKey: researchEvidenceRules.ruleKey })
        .from(researchEvidenceRules)
    : [];
  return {
    available: true,
    totalStudies: records.length,
    fullTextVerified: records.filter(
      record => record.reviewStatus === "FULL_TEXT_VERIFIED"
    ).length,
    abstractVerified: records.filter(
      record => record.reviewStatus === "ABSTRACT_VERIFIED"
    ).length,
    recordOnly: records.filter(record => record.reviewStatus === "RECORD_ONLY")
      .length,
    recommendationEligible: records.filter(
      record => record.recommendationEligible
    ).length,
    rules: rules.length,
  };
}

export function getEvidenceImportPreview() {
  return {
    totalStudies: evidenceSeedRecords.length,
    fullTextVerified: evidenceSeedRecords.filter(
      record => record.study.reviewStatus === "FULL_TEXT_VERIFIED"
    ).length,
    abstractVerified: evidenceSeedRecords.filter(
      record => record.study.reviewStatus === "ABSTRACT_VERIFIED"
    ).length,
    recordOnly: evidenceSeedRecords.filter(
      record => record.study.reviewStatus === "RECORD_ONLY"
    ).length,
    rules: evidenceModelRules.length,
  };
}
