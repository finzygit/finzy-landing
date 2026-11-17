// MOB-1488: the activity detail's «Campo» column names each field in Italian.
// KEYS is every before/after key the backend records today
// (ActivityLog::record in app/Http/Controllers/Console and app/Services/Admin,
// finzy-backend main on 17 Nov 2026), plus `plan` and `expires_at`: the ticket's
// examples, not recorded by the backend (it writes `piano` and `scadenza`).
import { describe, expect, it } from "vitest";
import { FIELD, fieldName } from "./activity";

const KEYS = [
  // content: avatars, lessons, videos, tutorial, settings
  "id", "attivo", "name_it", "name_en", "ordine", "sezione", "visibile", "titolo", "lezioni",
  "title", "summary", "objectives", "hashtags", "category", "active", "lingua", "durata",
  "pagina", "funzione", "title_it", "title_en", "body_it", "body_en",
  "maintenance", "ask_review", "ask_review_android", "min_version", "privacy_url_it", "privacy_url_en", "terms_url_it", "terms_url_en",
  // news
  "titolo_it", "titolo_en", "testo_it", "testo_en", "immagine", "azione_id", "giudizio", "relation_source", "relation_confidence", "relation_type",
  "nome_it", "nome_en", "descrizione_it", "descrizione_en",
  // people, roles, users, plans, exports
  "ruolo", "nome", "permessi", "piano", "scadenza", "sospeso", "campi", "righe", "piani", "ricerca", "filtri", "mese", "tipo", "piattaforma",
  // promotions
  "name", "code", "starts_at", "ends_at", "countries", "statuses", "formulas",
  // stocks
  "common_name", "common_name_locked", "alternatives", "logo", "banner",
  // named in MOB-1488
  "plan", "expires_at",
];

describe("field names in the activity detail", () => {
  it.each(KEYS)("%s has its own Italian name", (key) => {
    expect(FIELD[key] ?? FIELD[key.replace(/_(it|en)$/, "")]).toBeTruthy();
    const name = fieldName(key);
    expect(name).not.toMatch(/_/);
    expect(name).not.toBe(key);
    expect(name[0]).toBe(name[0].toUpperCase());
  });

  it("says the words a person reads", () => {
    expect(fieldName("common_name")).toBe("Nome comune");
    expect(fieldName("common_name_locked")).toBe("Nome bloccato");
    expect(fieldName("expires_at")).toBe("Scadenza");
    expect(fieldName("plan")).toBe("Piano");
    expect(fieldName("relation_source")).toBe("Origine del collegamento");
    expect(fieldName("azione_id")).toBe("Titolo collegato (n.)");
    expect(fieldName("title_it")).toBe("Titolo in italiano");
    expect(fieldName("nome_en")).toBe("Nome in inglese");
    expect(fieldName("terms_url_en")).toBe("Termini e condizioni in inglese");
    expect(fieldName("ask_review_android")).toBe("Chiedi la recensione su Android");
  });

  it("a key it does not know yet still reads as words, never snake_case", () => {
    expect(fieldName("trial_days_left")).toBe("Trial days left");
    expect(fieldName("note_it")).toBe("Note in italiano");
    expect(fieldName("voto")).toBe("Voto");
    expect(fieldName("")).toBe("—");
    expect(fieldName("constructor")).toBe("Constructor"); // never an inherited property of the table
  });
});
