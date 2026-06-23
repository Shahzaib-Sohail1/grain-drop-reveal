import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

// This tells our framework that "/dashboard" is now an official page on our website
export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
})

interface CapturedFrame {
  id: string
  timestamp: string
  filterApplied: string
  thumbnailUrl: string
}

function DashboardComponent() {
  const [localFrames, setLocalFrames] = useState<CapturedFrame[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)

  // This hook only runs once the webpage is safely open inside the user's actual browser
  useEffect(() => {
    setHasHydrated(true)
    
    // Grab the user's personal film roll history from their browser storage
    const savedFrames = localStorage.getItem('grain_captured_frames')
    if (savedFrames) {
      try {
        setLocalFrames(JSON.parse(savedFrames))
      } catch (e) {
        console.error("Failed to parse local film roll", e)
      }
    }
  }, [])

  // While the server is processing, show a clean, pitch-black loading state
  if (!hasHydrated) {
    return <div className="min-h-screen bg-black text-yellow-400 font-mono p-8">INITIALIZING FILM ARCHIVE...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono p-6 selection:bg-yellow-400 selection:text-black">
      {/* Brutalist Header Banner */}
      <header className="border-4 border-white bg-black p-6 mb-8 shadow-[6px_6px_0px_0px_rgba(34,211,238,1)]">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-cyan-400">
          PERSONAL FILM ARCHIVE
        </h1>
        <p className="text-xs text-zinc-400 mt-2 uppercase tracking-widest">
          Zero-Auth Local Storage Memory Footprint // {localFrames.length} Frames Exposed
        </p>
      </header>

      {localFrames.length === 0 ? (
        /* Empty State */
        <div className="border-4 border-dashed border-zinc-700 p-12 text-center bg-zinc-900/50">
          <p className="text-zinc-500 font-bold uppercase tracking-wider mb-4">
            No film frames found in this browser session.
          </p>
          <div className="inline-block bg-yellow-400 text-black px-4 py-2 font-black text-xs uppercase border-2 border-black">
            Go Burn a Frame
          </div>
        </div>
      ) : (
        /* Chronological Photo Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localFrames.map((frame, index) => (
            <div 
              key={frame.id || index} 
              className="border-4 border-white bg-black p-4 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(163,230,53,1)]"
            >
              {/* Photo Box Container */}
              <div className="relative aspect-square w-full bg-zinc-900 border-2 border-zinc-700 overflow-hidden group">
                <img 
                  src={frame.thumbnailUrl} 
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover contrast-125 saturate-150"
                  onError={(e) => {
                    // Fallback placeholder if local image data path breaks
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80"
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 border border-white font-bold">
                  FRAME #{index + 1}
                </div>
              </div>

              {/* Photo Metadata Footer */}
              <div className="mt-4 pt-4 border-t-2 border-zinc-800 text-xs text-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-white uppercase">Filter Matrix:</span>
                  <span className="text-lime-400 font-bold">{frame.filterApplied || 'CUSTOM_GRAIN'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-white uppercase">Captured:</span>
                  <span>{frame.timestamp || 'RECENTLY'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
