"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-green no-print">
      🖨️ Opslaan als PDF / printen
    </button>
  );
}
