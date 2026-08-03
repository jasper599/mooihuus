import React from "react";

// Minimale Markdown-renderer voor blogartikelen: ## / ### koppen,
// alinea's, opsommingen met "- " en **vet**. Geen externe dependency.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={`${keyBase}-${i}`}>{p}</React.Fragment>;
  });
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      const text = para.join(" ");
      blocks.push(
        <p key={`p-${key++}`} className="leading-relaxed my-3 text-inkt">
          {renderInline(text, `p${key}`)}
        </p>
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${key++}`} className="list-disc pl-5 my-3 space-y-1 text-inkt">
          {list.map((li, i) => (
            <li key={i} className="leading-relaxed">{renderInline(li, `li${key}-${i}`)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flushPara(); flushList();
      blocks.push(<h3 key={`h3-${key++}`} className="font-display font-bold text-lg text-bosgroen-dk mt-6 mb-1">{renderInline(line.replace(/^###\s+/, ""), `h3${key}`)}</h3>);
    } else if (/^##\s+/.test(line)) {
      flushPara(); flushList();
      blocks.push(<h2 key={`h2-${key++}`} className="font-display font-bold text-xl text-bosgroen-dk mt-8 mb-2">{renderInline(line.replace(/^##\s+/, ""), `h2${key}`)}</h2>);
    } else if (/^[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();

  return <div>{blocks}</div>;
}
