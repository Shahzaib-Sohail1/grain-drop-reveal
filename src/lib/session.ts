/**
 * Browser-session photo-cap tracking.
 * Each guest gets max 5 shots per event, persisted in sessionStorage so a
 * page refresh doesn't reset the limit. A random `guest_session` token tags
 * each upload, letting the host see distinct phones in the feed.
 */
export const SHOT_LIMIT = 5;

const guestKey = "grain.guest";
const countKey = (eventId: string) => `grain.shots.${eventId}`;

export function getGuestId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(guestKey);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(guestKey, id);
  }
  return id;
}

export function getShotsTaken(eventId: string): number {
  if (typeof window === "undefined") return 0;
  return Number(window.sessionStorage.getItem(countKey(eventId)) ?? 0);
}

export function incrementShots(eventId: string): number {
  const next = getShotsTaken(eventId) + 1;
  window.sessionStorage.setItem(countKey(eventId), String(next));
  return next;
}

export function getRemainingShots(eventId: string): number {
  return Math.max(0, SHOT_LIMIT - getShotsTaken(eventId));
}
