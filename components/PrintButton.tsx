"use client";

export function PrintButton({ label = "Download / print (PDF)" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn no-print">
      {label}
    </button>
  );
}
