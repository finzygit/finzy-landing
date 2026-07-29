import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Immagine di anteprima per la condivisione social (Open Graph / Twitter).
export const alt = "finzy — la tua finestra semplice sul mondo della finanza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logo = readFileSync(join(process.cwd(), "public/finzy-favicon.png"));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 38%, #0b2b29 0%, #080a0e 62%)",
          padding: 80,
        }}
      >
        <img
          src={logoSrc}
          width={240}
          height={240}
          style={{
            borderRadius: 48,
            boxShadow: "0 0 90px 10px rgba(32,229,209,0.35)",
          }}
        />
        <div
          style={{
            marginTop: 44,
            fontSize: 40,
            lineHeight: 1.3,
            color: "#aeb9c4",
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          La tua finestra semplice e personalizzata sul mondo della finanza
        </div>
      </div>
    ),
    { ...size },
  );
}
