/**
 * Clears client-side storage on logout while preserving per-browser UI
 * preferences that are not tied to the user's identity.
 *
 * Preserved keys:
 *  - `theme`    → next-themes light/dark mode choice
 *  - `language` → selected UI language
 *
 * Everything else (cart, wishlist, cached UI state, etc.) is wiped.
 */
const PRESERVED_KEYS = ["theme", "language"] as const;

export function clearClientStorageOnLogout() {
  if (typeof window === "undefined") return;

  try {
    const preserved: Record<string, string> = {};
    for (const key of PRESERVED_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value !== null) preserved[key] = value;
    }

    window.localStorage.clear();
    window.sessionStorage.clear();

    for (const [key, value] of Object.entries(preserved)) {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error("Failed to clear client storage on logout:", error);
  }
}
