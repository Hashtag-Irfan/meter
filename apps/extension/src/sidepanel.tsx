import React from "react";
import { createRoot } from "react-dom/client";

function SidePanel() {
  return (
    <main className="p-4 flex flex-col gap-4">
      <h1 className="text-lg font-bold tracking-tight">METER</h1>
      <p className="text-xs text-white/60">Local AI logs observer extension.</p>
    </main>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
}
