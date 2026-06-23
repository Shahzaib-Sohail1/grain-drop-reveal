import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GRAIN — Create your event" },
      { name: "description", content: "Spin up a delayed-reveal disposable camera event in 10 seconds. Print the QR. Hand it out." },
      { property: "og:title", content: "GRAIN — Create your event" },
      { property: "og:description", content: "Spin up a delayed-reveal disposable camera event in 10 seconds." },
    ],
  }),
  component: CreateEvent,
});

// Duration presets for the reveal countdown — hours from creation.
const DURATIONS = [
  { label: "06H", hours: 6 },
  { label: "12H", hours: 12 },
  { label: "24H", hours: 24 },
];

function CreateEvent() {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(12);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Build the URL the QR will encode — guests scan straight into the camera.
  const eventUrl = createdId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/e/${createdId}`
    : null;

  // Render the QR locally with the qrcode library — zero network calls.
  useEffect(() => {
    if (!eventUrl || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, eventUrl, {
      width: 280,
      margin: 1,
      color: { dark: "#0a0a0a", light: "#caff33" },
      errorCorrectionLevel: "H",
    });
  }, [eventUrl]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const reveal = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("events")
      .insert({ title: title.trim(), reveal_timestamp: reveal })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      alert(`Couldn't spin up event: ${error?.message}`);
      return;
    }
    setCreatedId(data.id);
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto flex flex-col">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <div className="size-3 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] tracking-[0.4em] text-muted-foreground">LIVE // BETA</span>
        </div>
        <h1 className="mt-3 text-6xl font-black tracking-tighter leading-none">
          GRAIN<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground tracking-wider uppercase">
          The disposable camera the internet forgot.
        </p>
      </header>

      {!createdId ? (
        <form onSubmit={handleCreate} className="space-y-7">
          <div>
            <label className="text-[11px] tracking-[0.3em] text-muted-foreground block mb-2">
              [ EVENT TITLE ]
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={42}
              placeholder="ROOFTOP / SAT NIGHT"
              className="w-full bg-card border-2 border-border focus:border-primary outline-none px-4 py-4 text-lg uppercase tracking-wider transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[11px] tracking-[0.3em] text-muted-foreground block mb-2">
              [ REVEAL IN ]
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d.hours}
                  onClick={() => setHours(d.hours)}
                  className={`py-5 border-2 font-bold text-2xl tracking-wider transition-all ${
                    hours === d.hours
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-muted-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground tracking-wider">
              {"//"} PHOTOS LOCKED UNTIL THE TIMER HITS ZERO
            </p>
          </div>

          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="w-full py-5 bg-primary text-primary-foreground font-black text-xl tracking-[0.2em] disabled:opacity-40 transition-opacity neon-border"
          >
            {creating ? "SPINNING UP…" : "DROP THE QR ▸"}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="border-2 border-primary p-6 bg-card grain-overlay">
            <p className="text-[10px] tracking-[0.4em] text-primary mb-2">// READY</p>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">{title}</h2>
            <div className="flex items-center justify-center bg-background p-4 border border-border">
              <canvas ref={qrCanvasRef} className="block" />
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground tracking-wider break-all">
              {eventUrl}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/e/$eventId"
              params={{ eventId: createdId }}
              className="text-center py-4 border-2 border-border bg-card font-bold text-xs tracking-[0.2em] hover:border-primary"
            >
              OPEN CAMERA
            </Link>
            <Link
              to="/g/$eventId"
              params={{ eventId: createdId }}
              className="text-center py-4 border-2 border-border bg-card font-bold text-xs tracking-[0.2em] hover:border-accent"
            >
              VIEW FEED
            </Link>
          </div>

          <button
            onClick={() => { setCreatedId(null); setTitle(""); }}
            className="w-full py-3 text-[11px] tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← NEW EVENT
          </button>
        </div>
      )}

      <footer className="mt-auto pt-12 text-[10px] tracking-[0.3em] text-muted-foreground">
        GRAIN // FILM IS DEAD. LONG LIVE FILM.
      </footer>
    </main>
  );
}
