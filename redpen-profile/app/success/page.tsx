"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BeforeAfter from "@/components/BeforeAfter";
import CopyButton from "@/components/CopyButton";
import type { Audit } from "@/lib/schema";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // ~3 minutes — webhook analysis can take a while

function SuccessContent() {
  const sessionId = useSearchParams().get("session_id");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session. If you just paid, use the link in your email.");
      return;
    }
    let polls = 0;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      polls += 1;
      try {
        const res = await fetch(`/api/session-result?session_id=${encodeURIComponent(sessionId!)}`);
        if (res.status === 202) {
          if (polls >= MAX_POLLS) {
            setError(
              "Your rewrite is taking longer than expected. Don't worry — it will arrive in your inbox within a few minutes."
            );
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load your result.");
          return;
        }
        setAudit(data.audit as Audit);
      } catch {
        if (polls < MAX_POLLS) setTimeout(poll, POLL_INTERVAL_MS);
        else setError("Network error. Your rewrite was still sent to your email.");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <div className="border-2 border-ink bg-yellow/40 p-6">
        <h2 className="font-display text-lg font-bold">Almost there</h2>
        <p className="mt-2 text-sm leading-relaxed">{error}</p>
        <Link href="/" className="mt-4 inline-block font-mono text-sm text-red underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="border-2 border-ink p-10 text-center">
        <p className="font-display text-xl font-black">Payment received ✓</p>
        <p className="mt-3 animate-pulse font-mono text-sm text-ink/70">
          The RedPen is rewriting your full profile… this takes up to a minute.
        </p>
        <p className="mt-2 font-mono text-xs text-ink/50">
          A copy is also on its way to your inbox.
        </p>
      </div>
    );
  }

  const allText = [
    `HEADLINE\n${audit.headline_after}`,
    `ABOUT\n${audit.about_after}`,
    ...audit.experiences.map(
      (xp) => `${xp.title.toUpperCase()} — ${xp.company}\n${xp.bullets_after.map((b) => `• ${b}`).join("\n")}`
    ),
    `QUICK WINS\n${audit.quick_wins.map((w, i) => `${i + 1}. ${w}`).join("\n")}`,
  ].join("\n\n");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-ink bg-ink p-6 text-paper">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-yellow">
            Full rewrite unlocked
          </p>
          <p className="mt-1 font-display text-3xl font-black">
            {audit.score}
            <span className="text-lg text-paper/50">/100 → your move</span>
          </p>
          <p className="mt-1 text-sm text-paper/80">
            Also sent to your inbox. Replace every <strong>[ADD METRIC]</strong> with a real number.
          </p>
        </div>
        <CopyButton text={allText} label="Copy everything" />
      </div>

      <BeforeAfter title="Headline" before={audit.headline_before} after={audit.headline_after} />
      <BeforeAfter title="About" before={audit.about_before} after={audit.about_after} />

      {audit.experiences.map((xp, i) => (
        <BeforeAfter
          key={`${xp.company}-${i}`}
          title={`Experience — ${xp.title} @ ${xp.company}`}
          before={xp.bullets_before.map((b) => `• ${b}`).join("\n")}
          after={xp.bullets_after.map((b) => `• ${b}`).join("\n")}
        />
      ))}

      <section className="border-2 border-ink">
        <div className="flex items-center justify-between border-b-2 border-ink bg-yellow px-4 py-2">
          <h3 className="font-display text-base font-bold uppercase tracking-wide">Quick wins</h3>
          <CopyButton text={audit.quick_wins.map((w, i) => `${i + 1}. ${w}`).join("\n")} />
        </div>
        <ol className="space-y-3 p-5">
          {audit.quick_wins.map((win, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="font-mono font-bold text-red">{String(i + 1).padStart(2, "0")}</span>
              <span>{win}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="font-mono text-xs text-ink/50">
        This page stays available for 24 hours. The email copy is yours forever. Your uploaded
        profile has been deleted from our storage.
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="mb-8 font-display text-3xl font-black tracking-tight">Your rewrite</h1>
      <Suspense
        fallback={
          <p className="animate-pulse font-mono text-sm text-ink/60">Loading…</p>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
