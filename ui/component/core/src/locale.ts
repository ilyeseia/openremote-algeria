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

/**
 * Central definition of the interface languages supported by the UI.
 * This file has no dependencies so that it can be unit tested in isolation.
 */

export interface Languages {
  [langKey: string]: string;
}

/** Interface language used when no (valid) preference exists. */
export const DEFAULT_LANGUAGE = "ar";

/** Language used for keys that are not translated in the active language. */
export const FALLBACK_LANGUAGE = "en";

/** The only supported interface languages, in display order: Arabic, English, French. */
export const DEFAULT_LANGUAGES: Languages = {
  ar: "arabic",
  en: "english",
  fr: "french",
};

export const SUPPORTED_LANGUAGES: string[] = Object.keys(DEFAULT_LANGUAGES);

/** Languages written right-to-left. */
const RTL_LANGUAGES = ["ar"];

/**
 * Reduce a stored or browser locale (e.g. "fr-FR", "AR_dz") to a supported language code.
 * @returns the supported language code or undefined when the value is missing or unsupported
 */
export function normaliseLanguage(lang: unknown): string | undefined {
  if (typeof lang !== "string") {
    return undefined;
  }
  const code = lang.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(code) ? code : undefined;
}

/**
 * Pick the first supported language from the candidates, in priority order.
 * Unsupported or empty candidates are skipped; {@link DEFAULT_LANGUAGE} is used when none is valid.
 */
export function resolveLanguage(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const lang = normaliseLanguage(candidate);
    if (lang) {
      return lang;
    }
  }
  return DEFAULT_LANGUAGE;
}

export function getLanguageDirection(lang: string | undefined): "rtl" | "ltr" {
  return RTL_LANGUAGES.includes(normaliseLanguage(lang) ?? "") ? "rtl" : "ltr";
}

/**
 * Apply the language and text direction to the document so that every component (including those with a shadow
 * root, which inherit `direction`) and CSS logical properties follow the active language.
 */
export function applyDocumentLanguage(lang: string, doc: Document = document): void {
  const code = normaliseLanguage(lang) ?? DEFAULT_LANGUAGE;
  doc.documentElement.lang = code;
  doc.documentElement.dir = getLanguageDirection(code);
}
