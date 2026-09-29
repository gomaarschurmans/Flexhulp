// Gedeeld tussen auth/actions.ts (zet de cookies bij het inloggen) en
// supabase/middleware.ts (leest ze om een "niet onthouden"-sessie na een
// browserherstart geforceerd uit te loggen).
export const REMEMBER_COOKIE = "flexhulp_remember";
export const ACTIVE_SESSION_COOKIE = "flexhulp_active_session";
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 400; // 400 dagen (max. toegestaan)
