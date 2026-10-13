/*
 * Copyright 2026, OpenRemote Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
// Dependency free tests, run with `node --test test/` (Node 22.18+ strips the TypeScript types itself)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_LANGUAGES,
  SUPPORTED_LANGUAGES,
  applyDocumentLanguage,
  getLanguageDirection,
  normaliseLanguage,
  resolveLanguage,
} from "../src/locale.ts";

const localesDir = fileURLToPath(new URL("../../../app/shared/locales", import.meta.url));

function flatten(obj, prefix = []) {
  return Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === "object"
      ? flatten(value, [...prefix, key])
      : [[JSON.stringify([...prefix, key]), value]]
  );
}

const loadLocale = (lang) => new Map(flatten(JSON.parse(readFileSync(join(localesDir, lang, "or.json"), "utf8"))));
const placeholders = (text) => (String(text).match(/\{\{[^}]*\}\}/g) ?? []).sort();

test("should default to Arabic when there is no saved preference", () => {
  assert.equal(DEFAULT_LANGUAGE, "ar");
  assert.equal(resolveLanguage(), "ar");
  assert.equal(resolveLanguage(undefined, null, ""), "ar");
});

test("should offer exactly Arabic, English and French in that order", () => {
  assert.deepEqual(Object.keys(DEFAULT_LANGUAGES), ["ar", "en", "fr"]);
  assert.deepEqual(SUPPORTED_LANGUAGES, ["ar", "en", "fr"]);
});

test("should respect a saved English or French preference", () => {
  assert.equal(resolveLanguage("en"), "en");
  assert.equal(resolveLanguage("fr"), "fr");
  assert.equal(resolveLanguage("ar"), "ar");
  assert.equal(resolveLanguage("fr-FR"), "fr");
  assert.equal(resolveLanguage("EN_us"), "en");
});

test("should skip unsupported preferences and fall back to the next source", () => {
  assert.equal(resolveLanguage("de", "fr"), "fr");
  assert.equal(resolveLanguage("cn", "nl", undefined), "ar");
  assert.equal(resolveLanguage("de"), "ar");
});

test("should not break on malformed locale values", () => {
  for (const bad of [42, {}, [], "", "   ", "xx-YY", "__", "<script>"]) {
    assert.equal(normaliseLanguage(bad), undefined);
    assert.equal(resolveLanguage(bad), "ar");
  }
});

test("should only use a right-to-left direction for Arabic", () => {
  assert.equal(getLanguageDirection("ar"), "rtl");
  assert.equal(getLanguageDirection("ar-DZ"), "rtl");
  assert.equal(getLanguageDirection("en"), "ltr");
  assert.equal(getLanguageDirection("fr"), "ltr");
  assert.equal(getLanguageDirection(undefined), "ltr");
});

test("should update the document language and direction when the language changes", () => {
  const doc = { documentElement: { lang: "", dir: "" } };
  applyDocumentLanguage("ar", doc);
  assert.deepEqual(doc.documentElement, { lang: "ar", dir: "rtl" });
  applyDocumentLanguage("en", doc);
  assert.deepEqual(doc.documentElement, { lang: "en", dir: "ltr" });
  applyDocumentLanguage("fr", doc);
  assert.deepEqual(doc.documentElement, { lang: "fr", dir: "ltr" });
  // Switching back from an unsupported value restores the default rather than leaving a stale direction
  applyDocumentLanguage("de", doc);
  assert.deepEqual(doc.documentElement, { lang: "ar", dir: "rtl" });
});

test("should ship translation files for the supported languages only", () => {
  assert.deepEqual(readdirSync(localesDir).sort(), [...SUPPORTED_LANGUAGES].sort());
});

for (const lang of SUPPORTED_LANGUAGES.filter((l) => l !== "en")) {
  test(`should not miss any English key in the ${lang} translations`, () => {
    const en = loadLocale("en");
    const translated = loadLocale(lang);
    const missing = [...en.keys()].filter((key) => !translated.has(key));
    assert.deepEqual(missing, []);
  });

  test(`should keep the interpolation placeholders of English in the ${lang} translations`, () => {
    const en = loadLocale("en");
    const translated = loadLocale(lang);
    const mismatched = [...translated]
      .filter(([key, value]) => en.has(key) && JSON.stringify(placeholders(value)) !== JSON.stringify(placeholders(en.get(key))))
      // Known upstream inconsistencies in the existing French file that predate this change
      .filter(([key]) => !(lang === "fr" && ["deleteUserConfirm", "deleteRoleConfirm", "fromToDays", "forDays"].some((k) => key === JSON.stringify([k]))))
      .map(([key]) => key);
    assert.deepEqual(mismatched, []);
  });

  test(`should not leave blank translations in ${lang} that would hide the English text`, () => {
    // The ordinal suffixes are intentionally empty in Arabic, which has none
    const allowedEmpty = new Set(["nd", "rd", "st", "th", "the"].map((k) => JSON.stringify(["rrule", k])));
    const blank = [...loadLocale(lang)].filter(([key, value]) => value === "" && !allowedEmpty.has(key)).map(([key]) => key);
    assert.deepEqual(blank, []);
  });
}

test("should translate the language names shown in the selector in every supported language", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const locale = loadLocale(lang);
    for (const name of Object.values(DEFAULT_LANGUAGES)) {
      assert.ok(locale.get(JSON.stringify([name])), `${lang} is missing the language name '${name}'`);
    }
  }
});

test("should write Arabic as Arabic rather than leaving English text behind", () => {
  const en = loadLocale("en");
  const ar = loadLocale("ar");
  const hasArabic = (text) => /[؀-ۿ]/.test(text);
  // Symbols, protocol names and the like are exempt; anything with a long plain English word must be translated
  const untranslated = [...ar]
    .filter(([key, value]) => en.get(key) === value && /[A-Za-z]{4,}/.test(value) && !hasArabic(value))
    .map(([key]) => key);
  assert.deepEqual(untranslated.sort(), [
    JSON.stringify(["configuration", "geoJson"]),
    JSON.stringify(["rulesLanguages", "GROOVY"]),
    JSON.stringify(["rulesLanguages", "JAVASCRIPT"]),
    JSON.stringify(["units", "inch_mercury"]),
  ].sort());
});
