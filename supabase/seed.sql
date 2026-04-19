-- buddy-note seed data
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).

-- =====================================================================
-- slug_reserved
-- Eng review §1.6 reserved list. Kept in sync with Next.js routes +
-- common/branded terms. New routes added to app/ must add their top-level
-- segment here (consider a lint rule in Week 1+).
-- =====================================================================
INSERT INTO public.slug_reserved (slug) VALUES
  -- infra / framework routes
  ('admin'),
  ('api'),
  ('auth'),
  ('_next'),
  ('static'),
  ('robots'),
  ('sitemap'),
  -- auth UX
  ('signup'),
  ('signin'),
  ('login'),
  ('logout'),
  -- product navigation
  ('help'),
  ('about'),
  ('dashboard'),
  ('settings'),
  ('account'),
  ('profile'),
  ('public'),
  ('private'),
  ('home'),
  ('index'),
  -- namespace collisions
  ('b'),
  ('share'),
  ('app'),
  ('support'),
  ('contact'),
  ('team'),
  ('billing'),
  ('pricing'),
  ('terms'),
  ('privacy')
ON CONFLICT (slug) DO NOTHING;
