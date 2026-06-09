import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { AuditSchema, clampAudit, type Audit } from "./schema";

// Lazy so a missing ANTHROPIC_API_KEY surfaces as a catchable request-time
// error (clear JSON message) instead of crashing the route module at import.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic();
  }
  return _client;
}

export const MIN_PROFILE_CHARS = 200;
export const MAX_PROFILE_CHARS = 60_000;

export class ProfileTooShortError extends Error {
  constructor() {
    super("Profile text is too short to audit");
  }
}

export async function analyzeProfile(profileText: string): Promise<Audit> {
  const text = profileText.trim();
  if (text.length < MIN_PROFILE_CHARS) throw new ProfileTooShortError();

  const response = await getClient().messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(text.slice(0, MAX_PROFILE_CHARS)) }],
    output_config: { format: zodOutputFormat(AuditSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`Analysis did not return valid JSON (stop_reason: ${response.stop_reason})`);
  }
  return clampAudit(response.parsed_output);
}
