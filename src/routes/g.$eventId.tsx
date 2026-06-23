import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRemaining, isRevealed } from "@/lib/countdown";

export const Route = createFileRoute("/g/$eventId")({
  component: Gallery,
});

interface EventRow { id: string; title: string; reveal_timestamp: string; }
interface PhotoRow { id: string; image_url: string; created_at: string; }

function Gallery() {
  const { eventId } = Route.useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);

  // Initial fetch of event + existing photos.
  useEffect(() => {
    (async () => {
      const [{ data: ev }, { data: ph }] = await Promise.all([
        supabase.from("events").select("id, title, reveal_timestamp").eq("id", eventId).maybeSingle(),
        supabase.from("photos").select("id, image_url, created_at").eq("event_id", eventId).order("created_at", { ascending: false }),
      ]);
      setEvent((ev ?? null) as EventRow | null);
      setPhotos((ph ?? []) as PhotoRow[]);
      setLoading(false);
    })();
  }, [eventId]);

  // 1Hz tick drives the countdown clock.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Live subscribe — new shots appear (blurred until reveal) in real time.
  useEffect(() => {
    const channel = supabase
      .channel(`photos-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "photos", filter: `event_id=eq.${eventId}` },
        (payload) => setPhotos((cur) => [payload.new as PhotoRow, ...cur]),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-[10px] tracking-[0.4em] text-muted-foreground">
        LOADING ROLL…
      </main>
    );
  }
  if (!event) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[10px] tracking-[0.4em] text-destructive">// EVENT NOT FOUND</p>
        <Link to="/" className="text-xs underline">go home</Link>
      </main>
    );
  }

  const revealed = isRevealed(event.reveal_timestamp, now);
  const countdown = formatRemaining(event.reveal_timestamp, now);

  return (
    <main className="min-h-screen px-5 py-6 max-w-md mx-auto">
      <header className="mb-6">
        <Link to="/" className="text-[10px] tracking-[0.3em] text-muted-foreground">← GRAIN</Link>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tighter">{event.title}</h1>
        <p className="text-[10px] tracking-[0.3em] text-muted-foreground mt-1">
          {photos.length} SHOT{photos.length === 1 ? "" : "S"} ON THE ROLL
        </p>
      </header>

      <div className={`border-2 p-5 mb-5 grain-overlay ${revealed ? "border-primary" : "border-accent"}`}>
        <p className={`text-[10px] tracking-[0.4em] mb-2 ${revealed ? "text-primary" : "text-accent"}`}>
          {revealed ? "// DEVELOPED" : "// DEVELOPING"}
        </p>
        <p className="text-5xl font-black tracking-tighter tabular-nums">
          {revealed ? "READY" : countdown}
        </p>
        {!revealed && (
          <p className="text-[10px] tracking-[0.3em] text-muted-foreground mt-2">
            UNLOCKS {new Date(event.reveal_timestamp).toLocaleString()}
          </p>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-border p-10 text-center">
          <p className="text-[10px] tracking-[0.3em] text-muted-foreground">// NO SHOTS YET</p>
          <Link
            to="/e/$eventId"
            params={{ eventId }}
            className="mt-4 inline-block py-3 px-5 border-2 border-primary text-primary text-xs tracking-[0.2em] font-bold"
          >
            OPEN CAMERA →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((p) => (
            <PhotoTile key={p.id} url={p.image_url} revealed={revealed} />
          ))}
        </div>
      )}
    </main>
  );
}

function PhotoTile({ url, revealed }: { url: string; revealed: boolean }) {
  // Locked: render a heavily blurred, pulsing card with a lock icon overlay.
  if (!revealed) {
    return (
      <div className="relative aspect-square bg-card border border-border overflow-hidden grain-overlay">
        <div
          className="absolute inset-0 pulse-lock"
          style={{
            backgroundImage: `url(${url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(28px) saturate(0.55) brightness(0.6)",
            transform: "scale(1.18)",
          }}
        />
        <div className="absolute inset-0 bg-background/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="size-7 text-foreground/70" strokeWidth={1.5} />
        </div>
      </div>
    );
  }
  // Revealed: full-quality image.
  return (
    <div className="relative aspect-square bg-card border border-border overflow-hidden grain-overlay">
      <img src={url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}
