/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Where the Cloud edition checks in.
 *
 * The key below is the *publishable* one. It is meant to be in the app — it
 * identifies the project and nothing else, and on its own it can read and
 * write nothing. What actually guards a shop's books is the row-level
 * security in the database: every policy is written against the signed-in
 * user, so a till can only ever touch rows belonging to its own shop, and
 * only CoreOs can set whether a shop is frozen. Leaking this key costs
 * nothing; leaking a shop's password costs that one shop.
 */

export const SUPABASE_URL = "https://kaligixkamddjricpbps.supabase.co";

export const SUPABASE_KEY = "sb_publishable_sjwF3CQcRmhxjrHURMypYg_N4J2eDgO";

/** How often a signed-in till asks the office whether it may still sell. */
export const CHECK_IN_MS = 120_000;
