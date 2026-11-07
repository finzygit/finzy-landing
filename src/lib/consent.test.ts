/**
 * Test della configurazione e del consenso iubenda (MOB-815). Si lanciano con
 * `pnpm test`.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEFAULT_COOKIE_POLICY_IDS,
  buildCsConfiguration,
  cookiePolicyIdFor,
  cookiePolicyUrl,
  grantedPurposes,
  parseIubendaConfig,
  wasWithdrawn,
} from "./consent.ts";

describe("parseIubendaConfig", () => {
  test("senza Site ID il banner resta spento", () => {
    assert.equal(parseIubendaConfig({}), null);
    assert.equal(parseIubendaConfig({ siteId: "" }), null);
    assert.equal(parseIubendaConfig({ siteId: "  " }), null);
  });

  test("un Site ID non numerico non accende il banner", () => {
    assert.equal(parseIubendaConfig({ siteId: "abc" }), null);
    assert.equal(parseIubendaConfig({ siteId: "12a" }), null);
    assert.equal(parseIubendaConfig({ siteId: "0" }), null);
  });

  test("con il solo Site ID valgono le policy pubblicate oggi", () => {
    const config = parseIubendaConfig({ siteId: " 4307406 " });
    assert.deepEqual(config, {
      siteId: 4307406,
      cookiePolicyIds: DEFAULT_COOKIE_POLICY_IDS,
    });
  });

  test("gli ID per lingua sostituiscono solo le lingue indicate", () => {
    const config = parseIubendaConfig({
      siteId: "1",
      cookiePolicyIds: "EN:111, de:222",
    });
    assert.equal(config?.cookiePolicyIds.en, 111);
    assert.equal(config?.cookiePolicyIds.de, 222);
    assert.equal(config?.cookiePolicyIds.it, DEFAULT_COOKIE_POLICY_IDS.it);
  });

  test("un ID senza lingua vale per l'italiano; le voci rotte si ignorano", () => {
    const config = parseIubendaConfig({
      siteId: "1",
      cookiePolicyIds: "999,fr:abc,:5,,",
    });
    assert.equal(config?.cookiePolicyIds.it, 999);
    assert.equal(config?.cookiePolicyIds.fr, DEFAULT_COOKIE_POLICY_IDS.fr);
    assert.equal(config?.cookiePolicyIds[""], undefined);
  });
});

describe("cookie policy per lingua", () => {
  const config = parseIubendaConfig({ siteId: "1" })!;

  test("ogni lingua del sito ha la sua policy", () => {
    for (const lang of ["it", "en", "es", "fr", "pt"]) {
      assert.equal(cookiePolicyIdFor(config, lang), DEFAULT_COOKIE_POLICY_IDS[lang]);
    }
  });

  test("una lingua senza policy usa quella italiana", () => {
    assert.equal(cookiePolicyIdFor(config, "de"), DEFAULT_COOKIE_POLICY_IDS.it);
  });

  test("l'URL della cookie policy", () => {
    assert.equal(
      cookiePolicyUrl(68699235),
      "https://www.iubenda.com/privacy-policy/68699235/cookie-policy",
    );
  });
});

describe("buildCsConfiguration", () => {
  test("consenso per finalità, rifiuto visibile e X che rifiuta", () => {
    const config = parseIubendaConfig({ siteId: "4307406" })!;
    const cs = buildCsConfiguration(config, "en");
    assert.equal(cs.siteId, 4307406);
    assert.equal(cs.cookiePolicyId, DEFAULT_COOKIE_POLICY_IDS.en);
    assert.equal(cs.lang, "en");
    assert.equal(cs.perPurposeConsent, true);
    assert.equal(cs.banner.rejectButtonDisplay, true);
    assert.equal(cs.banner.closeButtonRejects, true);
    assert.equal(cs.banner.acceptButtonDisplay, true);
    assert.equal(cs.banner.rejectButtonColor, cs.banner.acceptButtonColor);
  });

  test("la scelta vale per tutte le lingue (salvata sotto il Site ID)", () => {
    const config = parseIubendaConfig({ siteId: "4307406" })!;
    assert.deepEqual(buildCsConfiguration(config, "it").storage, { useSiteId: true });
    assert.deepEqual(buildCsConfiguration(config, "fr").storage, { useSiteId: true });
  });
});

describe("grantedPurposes", () => {
  test("senza preferenza solo il necessario", () => {
    assert.deepEqual([...grantedPurposes(undefined)], ["necessary"]);
    assert.deepEqual([...grantedPurposes(null)], ["necessary"]);
    assert.deepEqual([...grantedPurposes({})], ["necessary"]);
  });

  test("rifiuto: solo il necessario", () => {
    const granted = grantedPurposes({
      consent: false,
      purposes: { "1": true, "2": false, "3": false, "4": false, "5": false },
    });
    assert.deepEqual([...granted], ["necessary"]);
  });

  test("consenso parziale: solo le finalità scelte", () => {
    const granted = grantedPurposes({
      purposes: { "1": true, "4": true, "5": false },
    });
    assert.deepEqual([...granted].sort(), ["measurement", "necessary"]);
  });

  test("accetta tutto", () => {
    const granted = grantedPurposes({
      consent: true,
      purposes: { "1": true, "2": true, "3": true, "4": true, "5": true },
    });
    assert.equal(granted.size, 5);
  });

  test("consenso senza dettaglio per finalità vale per tutte", () => {
    assert.equal(grantedPurposes({ consent: true }).size, 5);
  });

  test("solo true conta come consenso", () => {
    const granted = grantedPurposes({
      purposes: { "4": "true" as unknown as boolean, "5": 1 as unknown as boolean },
    });
    assert.deepEqual([...granted], ["necessary"]);
  });
});

describe("wasWithdrawn", () => {
  test("togliere una finalità è un ritiro, aggiungerla no", () => {
    const base = grantedPurposes({ purposes: { "4": true } });
    const more = grantedPurposes({ purposes: { "4": true, "5": true } });
    const less = grantedPurposes({ purposes: {} });
    assert.equal(wasWithdrawn(base, more), false);
    assert.equal(wasWithdrawn(base, less), true);
    assert.equal(wasWithdrawn(base, base), false);
  });
});
