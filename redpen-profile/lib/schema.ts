import { z } from "zod";

/**
 * Strict output schema for the Claude analysis.
 * Structured outputs do not support numeric min/max constraints,
 * so the 0-100 range is enforced in clampAudit() after parsing.
 */
export const ExperienceSchema = z.object({
  title: z.string().describe("Job title exactly as written in the source profile"),
  company: z.string().describe("Company name exactly as written in the source profile"),
  bullets_before: z
    .array(z.string())
    .describe("The original bullet points / description lines for this role, verbatim"),
  bullets_after: z
    .array(z.string())
    .describe(
      "Rewritten bullet points. Each starts with a strong verb and contains a quantified proof from the source, or the literal placeholder [ADD METRIC]"
    ),
});

export const AuditSchema = z.object({
  score: z
    .number()
    .describe("Overall profile score, integer between 0 and 100"),
  score_rationale: z
    .string()
    .describe("One blunt sentence (max 140 chars) explaining the main reason for the score"),
  headline_before: z.string().describe("The original headline, verbatim"),
  headline_after: z
    .string()
    .describe("Rewritten headline, max 220 chars: role + specialty + quantified outcome"),
  about_before: z.string().describe("The original About/Summary section, verbatim"),
  about_after: z
    .string()
    .describe("Rewritten About section: 3 short paragraphs, hook first line, zero buzzwords"),
  experiences: z.array(ExperienceSchema),
  quick_wins: z
    .array(z.string())
    .describe("5 to 8 concrete, immediately actionable fixes, ordered by impact"),
});

export type Audit = z.infer<typeof AuditSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;

/** Enforce constraints the structured-output schema cannot express. */
export function clampAudit(audit: Audit): Audit {
  return {
    ...audit,
    score: Math.max(0, Math.min(100, Math.round(audit.score))),
  };
}

/** The free tier of the response: score + headline only, plus teaser counts. */
export interface FreeResult {
  score: number;
  score_rationale: string;
  headline_before: string;
  headline_after: string;
  teaser: {
    has_about: boolean;
    experiences_count: number;
    quick_wins_count: number;
  };
  blobId: string;
}

export function toFreeResult(audit: Audit, blobId: string): FreeResult {
  return {
    score: audit.score,
    score_rationale: audit.score_rationale,
    headline_before: audit.headline_before,
    headline_after: audit.headline_after,
    teaser: {
      has_about: audit.about_before.trim().length > 0,
      experiences_count: audit.experiences.length,
      quick_wins_count: audit.quick_wins.length,
    },
    blobId,
  };
}
