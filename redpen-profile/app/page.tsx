import Link from "next/link";

/**
 * Landing page — placeholder respecting the brand charter (ink/paper/red/yellow,
 * Archivo + IBM Plex Mono + Inter). Swap the JSX for the final mockup when provided.
 */
export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
          <p className="mb-4 inline-block bg-yellow px-2 py-1 font-mono text-xs font-semibold uppercase tracking-widest">
            Free audit · No login · No scraping
          </p>
          <h1 className="font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Your LinkedIn profile is costing you interviews.
            <br />
            <span className="text-red">Let the RedPen fix it.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
            Upload your LinkedIn PDF or paste your profile. A ruthless AI editor scores it,
            kills the buzzwords, and rewrites every section with the numbers recruiters
            actually look for.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/audit"
              className="bg-red px-6 py-3 font-mono text-base font-bold text-paper hover:bg-ink"
            >
              Get my free score →
            </Link>
            <p className="font-mono text-sm text-ink/60">
              Full rewrite: <span className="font-bold text-ink">$19</span> one-time
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="font-display text-2xl font-black uppercase tracking-wide">
            How it works
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-px bg-paper/20 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Upload or paste",
                body:
                  "Use LinkedIn's own “Save to PDF” export, or paste your profile text. We never touch your account.",
              },
              {
                n: "02",
                title: "Get scored — free",
                body:
                  "A 0–100 score against a recruiter rubric, plus your headline rewritten on the spot. No email required.",
              },
              {
                n: "03",
                title: "Unlock the rewrite",
                body:
                  "$19 once. Headline, About, every experience as copy-paste blocks, plus a quick-wins checklist. Delivered by email.",
              },
            ].map((step) => (
              <div key={step.n} className="bg-ink p-6">
                <p className="font-mono text-sm font-semibold text-yellow">{step.n}</p>
                <h3 className="mt-2 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/75">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="font-display text-2xl font-black uppercase tracking-wide">
            The $19 rewrite includes
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              "A headline built on your sharpest quantified result — not adjectives.",
              "A 3-paragraph About section that hooks in the first line.",
              "Every experience rewritten as tight, metric-first bullets.",
              "[ADD METRIC] placeholders wherever a number is missing — we never invent your results.",
              "5–8 quick wins you can apply in under 15 minutes.",
              "Everything as copy-paste blocks, by email and online.",
            ].map((item) => (
              <li key={item} className="flex gap-3 border-2 border-ink bg-paper p-4">
                <span className="font-mono font-bold text-red">→</span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link
              href="/audit"
              className="inline-block bg-ink px-6 py-3 font-mono text-base font-bold text-paper hover:bg-red"
            >
              Start with the free audit →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust / legal */}
      <section>
        <div className="mx-auto max-w-5xl px-5 py-12">
          <div className="border-2 border-ink bg-yellow/40 p-6">
            <h2 className="font-display text-lg font-bold">Privacy, plainly</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/80">
              No LinkedIn login. No scraping. You upload a PDF or paste text — that&apos;s the
              only data we see. Your profile is stored for a maximum of 24 hours and deleted
              as soon as your rewrite is delivered. Not affiliated with LinkedIn Corporation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
