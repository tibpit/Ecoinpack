import { Resend } from "resend";
import type { Audit } from "./schema";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function block(label: string, content: string): string {
  return `
    <p style="margin:24px 0 6px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#D43A2F;font-weight:bold;">${esc(label)}</p>
    <pre style="margin:0;padding:16px;background:#131A22;color:#F6F4EE;border-radius:8px;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${esc(content)}</pre>`;
}

export function buildResultEmailHtml(audit: Audit, successUrl: string): string {
  const experiencesHtml = audit.experiences
    .map(
      (xp, i) => `
      <h3 style="margin:28px 0 0;font-family:Arial,sans-serif;font-size:16px;color:#131A22;">${i + 1}. ${esc(xp.title)} — ${esc(xp.company)}</h3>
      ${block("Copy-paste — bullets", xp.bullets_after.map((b) => `• ${b}`).join("\n"))}`
    )
    .join("");

  const quickWinsHtml = block(
    "Quick wins — do these today",
    audit.quick_wins.map((w, i) => `${i + 1}. ${w}`).join("\n")
  );

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#F6F4EE;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <p style="font-family:Menlo,Consolas,monospace;font-size:13px;color:#D43A2F;margin:0 0 4px;">REDPEN PROFILE</p>
    <h1 style="font-family:Arial,sans-serif;font-size:26px;color:#131A22;margin:0 0 8px;">Your full rewrite is ready.</h1>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#131A22;line-height:1.6;margin:0 0 4px;">
      Profile score: <strong>${audit.score}/100</strong> — ${esc(audit.score_rationale)}
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#131A22;line-height:1.6;">
      Every block below is ready to copy-paste into LinkedIn. Anywhere you see <strong>[ADD METRIC]</strong>, replace it with a real number from your work — that is the one thing we will never invent for you.
    </p>

    ${block("Copy-paste — headline", audit.headline_after)}
    ${block("Copy-paste — about", audit.about_after)}
    ${experiencesHtml}
    ${quickWinsHtml}

    <h2 style="font-family:Arial,sans-serif;font-size:18px;color:#131A22;margin:32px 0 8px;">How to apply (5 minutes)</h2>
    <ol style="font-family:Arial,sans-serif;font-size:14px;color:#131A22;line-height:1.8;padding-left:20px;margin:0;">
      <li>Open your LinkedIn profile and click the pencil icon next to your name. Paste the new headline.</li>
      <li>Scroll to <em>About</em> → pencil icon → replace the text with the new About block.</li>
      <li>For each role under <em>Experience</em>, open it and replace the description with the matching bullets.</li>
      <li>Fill in every [ADD METRIC] with a real number — even an estimate beats an adjective.</li>
      <li>Run through the quick wins list, top to bottom.</li>
    </ol>

    <p style="font-family:Arial,sans-serif;font-size:14px;color:#131A22;line-height:1.6;margin:24px 0;">
      You can also view this result online (link valid 24 hours):<br/>
      <a href="${esc(successUrl)}" style="color:#D43A2F;">${esc(successUrl)}</a>
    </p>

    <p style="font-family:Arial,sans-serif;font-size:11px;color:#888;margin-top:40px;">
      RedPen Profile is not affiliated with LinkedIn Corporation. Your uploaded profile is deleted from our storage after delivery of this email.
    </p>
  </div>
</body>
</html>`;
}

export async function sendResultEmail(to: string, audit: Audit, successUrl: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not set");
  const { error } = await getResend().emails.send({
    from,
    to,
    subject: `Your LinkedIn rewrite is ready (score: ${audit.score}/100)`,
    html: buildResultEmailHtml(audit, successUrl),
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
