import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth">
      <div className="state">
        <h2>Pagina non trovata</h2>
        <p>Questo indirizzo non esiste nella console.</p>
        <Link className="btn" href="/">
          Torna alla Home
        </Link>
      </div>
    </div>
  );
}
