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
export interface LocalisedDate {
  /** i18next language code. */
  language: string;
  /** The `lll` rendering of 15 December 2026 13:45 in that language. */
  expected: string;
}

/**
 * One entry per shipped translation. Each rendering is distinct from the English one, so a language
 * whose Moment locale data never made it into the bundle renders the wrong string.
 */
export const localisedDates: LocalisedDate[] = [
  { language: "en", expected: "Dec 15, 2026 1:45 PM" },
  { language: "ar", expected: "١٥ ديسمبر ٢٠٢٦ ١٣:٤٥" },
  { language: "fr", expected: "15 déc. 2026 13:45" },
];
