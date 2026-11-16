"use client";

// MOB-1372 (board ADM-SHELL-08-strumenti-lista): today's external tool links
// (config/external_tools.php), each opening in a new tab.

import { useCallback, useEffect, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Icon } from "@/components/shell/Icon";
import { PageHead, StateBlock } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";

type Tool = { label: string; description: string; url: string };

const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function ToolsPage() {
  const { api } = useConsole();
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    api.get<{ tools: Tool[] }>("/external-tools").then((r) => setTools(r.tools), () => setFailed(true));
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminFrame title="Strumenti esterni">
      <PageHead
        title="Strumenti esterni"
        sub="I servizi che usiamo fuori dalla console, come nel menu di oggi. Si aprono in una nuova scheda, con il tuo account di ciascun servizio."
        crumbs={["Amministrazione", "Strumenti esterni"]}
      />
      {failed ? (
        <StateBlock kind="error" title="Non è stato possibile caricare gli strumenti" action={<button type="button" className="btn" onClick={() => (setFailed(false), setTools(null), load())}>Riprova</button>} />
      ) : !tools ? (
        <StateBlock kind="loading" />
      ) : (
        <div className="grid-tools">
          {tools.map((t) => (
            <a key={t.label} className="card" href={t.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 14, padding: 18, color: "var(--text)", fontWeight: 400 }}>
              <span className="avatar" style={{ width: 44, height: 44, borderRadius: 13, color: "var(--accent-soft)" }}>{initials(t.label)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  {t.label} <Icon name="external" size={16} label="si apre in una nuova scheda" />
                </strong>
                <span className="sub" style={{ fontSize: 14, color: "var(--text-2)" }}>{t.description}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </AdminFrame>
  );
}
