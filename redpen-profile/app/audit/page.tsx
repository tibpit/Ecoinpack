"use client";

import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import type { FreeResult } from "@/lib/schema";

type Tab = "pdf" | "text";

export default function AuditPage() {
  const [tab, setTab] = useState<Tab>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FreeResult | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const form = new FormData();
    if (tab === "pdf") {
      if (!file) {
        setError("Choose your LinkedIn PDF first.");
        return;
      }
      form.append("file", file);
    } else {
      if (text.trim().length === 0) {
        setError("Paste your profile text first.");
        return;
      }
      form.append("text", text);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = (await res.json()) as FreeResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Analysis failed. Please try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function startCheckout() {
    if (!result) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobId: result.blobId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
        Free profile audit
      </h1>
      <p className="mt-2 text-ink/70">
        Score + headline rewrite, free. 3 audits per day. We never connect to your account.
      </p>

      {/* Input form */}
      {!result && (
        <form onSubmit={submit} className="mt-8 border-2 border-ink bg-paper">
          <div className="flex border-b-2 border-ink">
            <button
              type="button"
              onClick={() => setTab("pdf")}
              className={`flex-1 px-4 py-3 font-mono text-sm font-semibold ${
                tab === "pdf" ? "bg-ink text-paper" : "hover:bg-yellow/50"
              }`}
            >
              Upload LinkedIn PDF
            </button>
            <button
              type="button"
              onClick={() => setTab("text")}
              className={`flex-1 border-l-2 border-ink px-4 py-3 font-mono text-sm font-semibold ${
                tab === "text" ? "bg-ink text-paper" : "hover:bg-yellow/50"
              }`}
            >
              Paste text
            </button>
          </div>

          <div className="p-5">
            {tab === "pdf" ? (
              <div>
                <p className="mb-3 font-mono text-xs text-ink/60">
                  On LinkedIn: your profile → <strong>More</strong> →{" "}
                  <strong>Save to PDF</strong>. Upload that file here.
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer border-2 border-dashed border-ink/40 p-6 font-mono text-sm file:mr-4 file:border-2 file:border-ink file:bg-yellow file:px-4 file:py-2 file:font-mono file:text-sm file:font-semibold"
                />
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder="Paste your full profile: headline, About, every experience…"
                className="w-full border-2 border-ink/40 bg-white p-4 font-mono text-sm focus:border-ink focus:outline-none"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full bg-red px-6 py-3 font-mono text-base font-bold text-paper hover:bg-ink disabled:opacity-60"
            >
              {loading ? "The RedPen is reading… (~30s)" : "Audit my profile — free"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-4 border-2 border-red bg-red/10 p-4 font-mono text-sm text-red" role="alert">
          {error}
        </p>
      )}

      {/* Free result */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Score */}
          <div className="border-2 border-ink bg-ink p-6 text-paper">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-yellow">
              Your score
            </p>
            <p className="mt-1 font-display text-6xl font-black">
              {result.score}
              <span className="text-2xl text-paper/50">/100</span>
            </p>
            <p className="mt-2 text-sm text-paper/80">{result.score_rationale}</p>
          </div>

          {/* Free headline rewrite */}
          <section className="border-2 border-ink">
            <div className="flex items-center justify-between border-b-2 border-ink bg-yellow px-4 py-2">
              <h2 className="font-display text-base font-bold uppercase tracking-wide">
                Headline — rewritten free
              </h2>
              <CopyButton text={result.headline_after} />
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm text-ink/60 line-through decoration-red/60 decoration-2">
                {result.headline_before || "(no headline found)"}
              </p>
              <p className="bg-ink p-3 text-sm font-medium text-paper">{result.headline_after}</p>
            </div>
          </section>

          {/* Locked sections */}
          <div className="relative overflow-hidden border-2 border-ink">
            <div className="select-none space-y-5 p-5 blur-sm" aria-hidden="true">
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-red">About — rewritten</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/80">
                  I ship revenue, not adjectives. Over the last {"{X}"} years I turned {"{Y}"} into{" "}
                  {"{Z}"}, cut onboarding time by {"{N}"}%, and built the team that…
                </p>
              </div>
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-red">
                  {result.teaser.experiences_count} experience
                  {result.teaser.experiences_count === 1 ? "" : "s"} — rewritten
                </p>
                <ul className="mt-1 space-y-1 text-sm text-ink/80">
                  <li>• Grew ████████ by ██% in ██ months by ██████████…</li>
                  <li>• Cut ██████ costs $███K/yr after ██████████…</li>
                  <li>• Led ██ engineers shipping ██████████…</li>
                </ul>
              </div>
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-red">
                  {result.teaser.quick_wins_count} quick wins
                </p>
                <p className="mt-1 text-sm text-ink/80">1. ████████ 2. ████████ 3. ████████…</p>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-paper/60 p-6 text-center">
              <p className="font-display text-xl font-black">
                Unlock the full rewrite
              </p>
              <p className="max-w-md text-sm text-ink/80">
                About, all {result.teaser.experiences_count} experience
                {result.teaser.experiences_count === 1 ? "" : "s"}, and{" "}
                {result.teaser.quick_wins_count} quick wins — as copy-paste blocks, by email and
                online.
              </p>
              <button
                type="button"
                onClick={startCheckout}
                disabled={checkoutLoading}
                className="bg-red px-8 py-3 font-mono text-base font-bold text-paper hover:bg-ink disabled:opacity-60"
              >
                {checkoutLoading ? "Redirecting…" : "Unlock everything — $19"}
              </button>
              <p className="font-mono text-xs text-ink/50">One-time payment · Secure Stripe checkout</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setFile(null);
              setText("");
            }}
            className="font-mono text-sm text-ink/60 underline hover:text-red"
          >
            ← Audit another profile
          </button>
        </div>
      )}
    </div>
  );
}
