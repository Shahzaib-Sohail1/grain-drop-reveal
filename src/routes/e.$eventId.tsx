import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/g/$eventId")({
  component: SharedGalleryView,
});

interface CapturedFrame {
  id: string;
  timestamp: string;
  filterApplied: string;
  thumbnailUrl: string;
}

function SharedGalleryView() {
  const { eventId } = Route.useParams();
  const [eventTitle, setEventTitle] = useState("");
  const [localFrames, setLocalFrames] = useState<CapturedFrame[]>([]);

  useEffect(() => {
    // 1. Fetch event metadata safely
    supabase.from("events").select("title").eq("id", eventId).maybeSingle()
      .then(({ data }) => setEventTitle(data?.title ?? "WALI"));

    // 2. Hydrate from our localized browser film roll cache
    const savedFrames = localStorage.getItem('grain_captured_frames');
    if (savedFrames) {
      try {
        setLocalFrames(JSON.parse(savedFrames));
      } catch (e) {
        console.error("Local registry corruption", e);
      }
    }
  }, [eventId]);

  return (
    <main className="min-h-screen bg-black text-white font-mono p-5 flex flex-col selection:bg-yellow-400 selection:text-black">
      {/* Top Bar Navigation */}
      <header className="mb-6">
        <Link to="/" className="text-[10px] tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">
          ← GRAIN
        </Link>
        <h1 className="text-5xl font-black tracking-tighter mt-4 uppercase text-white">
          {eventTitle}
        </h1>
        <p className="text-xs text-zinc-400 tracking-wider uppercase mt-1">
          {localFrames.length} SHOTS ON THE ROLL
        </p>
      </header>

      {/* REVEAL PREVIEW CONTAINER */}
      <div className="border-4 border-yellow-500 bg-zinc-950 p-6 mb-8 relative shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]">
        <p className="text-[10px] tracking-[0.4em] text-yellow-500 font-bold mb-1">// SYSTEM DEVELOPMENT STATUS</p>
        <div className="text-4xl font-black tracking-tight my-2 font-mono text-white animate-pulse">
          ROLL EXPOSED
        </div>
        <p className="text-[11px] text-zinc-500 uppercase tracking-widest">
          Offline Sandboxing Mode // Bypassing Server Synchronization Boundaries
        </p>
      </div>

      {localFrames.length === 0 ? (
        /* Empty State */
        <div className="border-4 border-dashed border-zinc-800 p-10 text-center bg-zinc-900/30 flex-1 flex flex-col justify-center items-center">
          <p className="text-zinc-500 font-bold uppercase tracking-wider mb-4 text-xs">
            // NO SHOTS YET DEVELOPED ON THIS ENGINE
          </p>
          <Link
            to="/e/$eventId"
            params={{ eventId }}
            className="inline-block text-center px-6 py-3 border-2 border-lime-400 text-lime-400 font-black text-xs uppercase tracking-widest hover:bg-lime-400 hover:text-black transition-all"
          >
            Open Camera →
          </Link>
        </div>
      ) : (
        /* Real Local Storage Grid - Displaying filter results */
        <div className="space-y-6 flex-1">
          <p className="text-[11px] tracking-[0.3em] text-cyan-400 font-bold">// LOCAL ROLL REVEALED</p>
          <div className="grid grid-cols-1 gap-6">
            {localFrames.map((frame, idx) => (
              <div key={frame.id || idx} className="border-4 border-white bg-black p-4 space-y-3">
                <div className="relative aspect-square w-full overflow-hidden border-2 border-zinc-800">
                  <img
                    src={frame.thumbnailUrl}
                    alt="Processed Frame"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 tracking-tight font-mono">
                  <span>FRAME #{localFrames.length - idx}</span>
                  <span className="text-orange-400 font-bold">{frame.filterApplied}</span>
                  <span>{frame.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
