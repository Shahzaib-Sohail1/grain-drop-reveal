
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  reveal_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events read all" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events insert all" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  guest_session TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.photos TO anon, authenticated;
GRANT ALL ON public.photos TO service_role;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos read all" ON public.photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "photos insert all" ON public.photos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX photos_event_idx ON public.photos(event_id);
