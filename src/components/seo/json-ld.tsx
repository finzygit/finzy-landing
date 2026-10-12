/**
 * Dati strutturati JSON-LD. Server component: lo script è nell'HTML della
 * prima risposta, leggibile dai crawler che non eseguono JavaScript.
 */
export function JsonLd({ graph }: { graph: object[] }) {
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // `<` in unicode: nessuna stringa può chiudere lo script (XSS).
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
