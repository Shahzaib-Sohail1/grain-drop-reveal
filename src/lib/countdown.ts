/** Format remaining ms as HH:MM:SS, or "00:00:00" once revealed. */
export function formatRemaining(targetIso: string, nowMs = Date.now()): string {
  const diff = Math.max(0, new Date(targetIso).getTime() - nowMs);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function isRevealed(targetIso: string, nowMs = Date.now()): boolean {
  return new Date(targetIso).getTime() <= nowMs;
}
