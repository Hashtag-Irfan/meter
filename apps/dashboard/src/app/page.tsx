import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">METER</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Privacy-first analytics for AI coding assistants. Dashboard coming in Milestone 5.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-center text-xs text-muted-foreground">
        <span>Scaffold complete ✓</span>
        <span className="text-border">—</span>
        <span>Storage layer next →</span>
      </div>
    </main>
  );
}
