import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// 1. Initializing the Supabase Client (Replace with your actual import or env schema)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface HypeEvent {
  id: string
  event_type: 'shot_fired' | 'roll_completed' | 'feed_unlocked'
  username: string
  timestamp: string
}

export function HypeTicker() {
  const [events, setEvents] = useState<HypeEvent[]>([
    { id: 'init-1', event_type: 'shot_fired', username: 'anon_69', timestamp: 'now' },
    { id: 'init-2', event_type: 'roll_completed', username: 'pixel_purist', timestamp: '1m' },
  ])
  
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 2. Realtime Channel Subscription targeting the 'events' table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          const newEvent: HypeEvent = {
            id: payload.new.id,
            event_type: payload.new.event_type || 'shot_fired',
            username: payload.new.username || 'anonymous',
            timestamp: 'just now',
          }

          // Prepend and cap at 10 items to prevent DOM bloating
          setEvents((prev) => [newEvent, ...prev.slice(0, 9)])
        }
      )
      .subscribe()

    // 3. Prevent memory leaks on route destruction/re-renders
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Helper to format Gen Z style brutalist tags
  const getTagStyle = (type: HypeEvent['event_type']) => {
    switch (type) {
      case 'roll_completed': return 'bg-lime-400 text-black border-r border-black font-black px-2'
      case 'feed_unlocked': return 'bg-fuchsia-500 text-white border-r border-black font-black px-2'
      default: return 'bg-cyan-400 text-black border-r border-black font-black px-2'
    }
  }

  const getEventReadable = (type: HypeEvent['event_type']) => {
    switch (type) {
      case 'roll_completed': return 'DEVELOPED A 5-SHOT ROLL'
      case 'feed_unlocked': return 'UNLOCKED THE SHARED FEED'
      default: return 'BURNED A FILM FRAME'
    }
  }

  return (
    <div className="w-full bg-black border-y-4 border-black overflow-hidden select-none py-2 flex items-center relative shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]">
      {/* Brutalist "LIVE" Banner Pin */}
      <div className="absolute left-0 z-10 bg-yellow-400 text-black border-r-4 border-black px-4 font-black tracking-widest text-sm uppercase animate-pulse">
        LIVE FEED
      </div>

      {/* Endless Horizontal Marquee Stream */}
      <div 
        ref={tickerRef}
        className="flex whitespace-nowrap gap-8 pl-36 animate-marquee will-change-transform"
      >
        {events.map((event) => (
          <div 
            key={event.id} 
            className="inline-flex items-center bg-zinc-900 text-white border-2 border-white text-xs font-mono uppercase tracking-tight"
          >
            <span className={getTagStyle(event.event_type)}>
              {event.username}
            </span>
            <span className="px-3 font-bold py-1">
              {getEventReadable(event.event_type)}
            </span>
          </div>
        ))}
        {/* Mirror array duplicate to ensure seamless looping transition when width overflows */}
        {events.map((event) => (
          <div 
            key={`dup-${event.id}`} 
            className="inline-flex items-center bg-zinc-900 text-white border-2 border-white text-xs font-mono uppercase tracking-tight aria-hidden"
          >
            <span className={getTagStyle(event.event_type)}>
              {event.username}
            </span>
            <span className="px-3 font-bold py-1">
              {getEventReadable(event.event_type)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
