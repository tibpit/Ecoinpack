"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (old browser / non-HTTPS) — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 border-2 border-ink px-3 py-1 font-mono text-xs font-semibold transition-colors ${
        copied ? "bg-yellow" : "bg-paper hover:bg-yellow"
      }`}
      aria-live="polite"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
