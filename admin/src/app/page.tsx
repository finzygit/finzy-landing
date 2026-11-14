"use client";

// The Home belongs to MOB-1373 (admin redesign · 2): until it lands, the
// frame with a greeting so the shell can be tried end to end.
import { AdminFrame } from "@/components/shell/AdminFrame";
import { PageHead, Section } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";

export default function HomePage() {
  const { me } = useConsole();
  return (
    <AdminFrame title="Home">
      <PageHead title="Home" sub={me ? `Buongiorno ${me.user.name.split(" ")[0]}.` : undefined} crumbs={["Panoramica"]} />
      <Section>
        <p className="note" style={{ fontSize: 15 }}>I numeri della Home arrivano con la pagina Home (MOB-1373).</p>
      </Section>
    </AdminFrame>
  );
}
