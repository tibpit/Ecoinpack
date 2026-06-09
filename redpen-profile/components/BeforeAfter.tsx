import CopyButton from "./CopyButton";

/**
 * Side-by-side (stacked on mobile) before/after diff for one profile section,
 * with a copy button on the rewritten version.
 */
export default function BeforeAfter({
  title,
  before,
  after,
}: {
  title: string;
  before: string;
  after: string;
}) {
  return (
    <section className="border-2 border-ink bg-paper">
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2">
        <h3 className="font-display text-base font-bold uppercase tracking-wide">{title}</h3>
        <CopyButton text={after} label="Copy new version" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b-2 border-ink p-4 md:border-b-0 md:border-r-2">
          <p className="mb-2 font-mono text-xs font-semibold uppercase text-ink/50">Before</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/70 line-through decoration-red/60 decoration-2">
            {before || "(section missing from your profile)"}
          </p>
        </div>
        <div className="bg-ink p-4">
          <p className="mb-2 font-mono text-xs font-semibold uppercase text-yellow">After</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper">{after}</p>
        </div>
      </div>
    </section>
  );
}
