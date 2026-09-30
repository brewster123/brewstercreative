-- ==============================================================================
-- Brewster Creative — Phase 5D: Persistent Studio Content
-- Studio Profile, Services & Pricing, Portfolio Projects, and Portfolio Storage
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates/configures:
--   1. public.studio_profile (singleton row for studio identity & availability)
--   2. public.services (design packages, starting rates, turnarounds, deliverables)
--   3. public.portfolio_projects (showcase items, galleries, tools, tags)
--   4. Row Level Security (RLS):
--        - SELECT open to everyone (anon & authenticated visitors)
--        - INSERT/UPDATE/DELETE strictly restricted to Admins (public.is_admin())
--   5. Idempotent default seeding from canonical studio data
--   6. Dedicated public Supabase Storage bucket 'portfolio-media'
--   7. Storage RLS policies for 'portfolio-media' (public read, admin write/delete)
--   8. Supabase Realtime publication enablement for instant live synchronization
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: public.studio_profile
-- -----------------------------------------------------------------------------
create table if not exists public.studio_profile (
  id text primary key default 'default',
  designer_name text not null default 'Brewster A. Cabando',
  studio_name text not null default 'Brewster Creative',
  title text not null default 'Multimedia Artist & Brand Designer',
  bio text not null default 'Specializing in distinctive visual identities, conceptual poster art, typographic systems, and high-impact digital illustration for innovative brands, creators, and indie studios worldwide.',
  avatar text default 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  email text not null default 'brewstercreates@gmail.com',
  location text default 'Manila / Remote Worldwide',
  social_links jsonb not null default '{"instagram": "instagram.com/brewster.cabando", "behance": "behance.net/brewstercabando", "dribbble": "dribbble.com/brewstercabando", "twitter": "x.com/brewstercabando", "discord": "brewster#4021"}'::jsonb,
  currency text not null default 'PHP',
  currency_symbol text not null default '₱',
  commission_status text not null default 'open',
  available_slots integer not null default 3,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -----------------------------------------------------------------------------
-- 2. Table: public.services
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id text primary key,
  name text not null,
  category text not null,
  short_desc text not null,
  starting_price numeric not null,
  turnaround text not null,
  revisions_count integer not null default 2,
  deliverables text[] not null default '{}'::text[],
  popular boolean not null default false,
  icon_name text not null default 'Sparkles',
  related_shop_product_ids text[] not null default '{}'::text[],
  display_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_services_category on public.services(category);
create index if not exists idx_services_display_order on public.services(display_order asc, created_at asc);

-- -----------------------------------------------------------------------------
-- 3. Table: public.portfolio_projects
-- -----------------------------------------------------------------------------
create table if not exists public.portfolio_projects (
  id text primary key,
  title text not null,
  category text not null,
  short_desc text not null,
  full_desc text not null,
  image_url text not null,
  gallery_urls text[] not null default '{}'::text[],
  tools text[] not null default '{}'::text[],
  date text not null,
  client text not null,
  color_palette text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  featured boolean not null default false,
  related_shop_product_ids text[] not null default '{}'::text[],
  display_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_portfolio_category on public.portfolio_projects(category);
create index if not exists idx_portfolio_featured on public.portfolio_projects(featured);
create index if not exists idx_portfolio_display_order on public.portfolio_projects(display_order asc, created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS) & Grant Access
-- -----------------------------------------------------------------------------
alter table public.studio_profile enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_projects enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.studio_profile to anon, authenticated;
grant insert, update, delete on table public.studio_profile to authenticated;

grant select on table public.services to anon, authenticated;
grant insert, update, delete on table public.services to authenticated;

grant select on table public.portfolio_projects to anon, authenticated;
grant insert, update, delete on table public.portfolio_projects to authenticated;

-- Studio Profile Policies
drop policy if exists "Public can view studio profile" on public.studio_profile;
drop policy if exists "Admins can insert studio profile" on public.studio_profile;
drop policy if exists "Admins can update studio profile" on public.studio_profile;
drop policy if exists "Admins can delete studio profile" on public.studio_profile;

create policy "Public can view studio profile"
  on public.studio_profile for select
  using (true);

create policy "Admins can insert studio profile"
  on public.studio_profile for insert
  with check (public.is_admin());

create policy "Admins can update studio profile"
  on public.studio_profile for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete studio profile"
  on public.studio_profile for delete
  using (public.is_admin());

-- Services Policies
drop policy if exists "Public can view services" on public.services;
drop policy if exists "Admins can insert services" on public.services;
drop policy if exists "Admins can update services" on public.services;
drop policy if exists "Admins can delete services" on public.services;

create policy "Public can view services"
  on public.services for select
  using (true);

create policy "Admins can insert services"
  on public.services for insert
  with check (public.is_admin());

create policy "Admins can update services"
  on public.services for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete services"
  on public.services for delete
  using (public.is_admin());

-- Portfolio Projects Policies
drop policy if exists "Public can view portfolio projects" on public.portfolio_projects;
drop policy if exists "Admins can insert portfolio projects" on public.portfolio_projects;
drop policy if exists "Admins can update portfolio projects" on public.portfolio_projects;
drop policy if exists "Admins can delete portfolio projects" on public.portfolio_projects;

create policy "Public can view portfolio projects"
  on public.portfolio_projects for select
  using (true);

create policy "Admins can insert portfolio projects"
  on public.portfolio_projects for insert
  with check (public.is_admin());

create policy "Admins can update portfolio projects"
  on public.portfolio_projects for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete portfolio projects"
  on public.portfolio_projects for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Safe Idempotent Default Seeding
-- -----------------------------------------------------------------------------

-- Seed studio_profile if empty
insert into public.studio_profile (
  id, designer_name, studio_name, title, bio, avatar, email, location,
  social_links, currency, currency_symbol, commission_status, available_slots
)
values (
  'default',
  'Brewster A. Cabando',
  'Brewster Creative',
  'Multimedia Artist & Brand Designer',
  'Specializing in distinctive visual identities, conceptual poster art, typographic systems, and high-impact digital illustration for innovative brands, creators, and indie studios worldwide.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'brewstercreates@gmail.com',
  'Manila / Remote Worldwide',
  '{"instagram": "instagram.com/brewster.cabando", "behance": "behance.net/brewstercabando", "dribbble": "dribbble.com/brewstercabando", "twitter": "x.com/brewstercabando", "discord": "brewster#4021"}'::jsonb,
  'PHP',
  '₱',
  'open',
  3
)
on conflict (id) do nothing;

-- Seed services if table is empty
insert into public.services (
  id, name, category, short_desc, starting_price, turnaround, revisions_count,
  deliverables, popular, icon_name, related_shop_product_ids, display_order
)
values
(
  'srv-logo',
  'Logo Design',
  'Branding',
  'Memorable, scalable vector logo marks and wordmarks tailored to your unique market identity.',
  3500,
  '3–7 days',
  2,
  array[
    'Primary logo + icon mark + monochrome variants',
    'High-res PNG, JPG, and scalable SVG/EPS vector formats',
    'Color breakdown & basic typography guidelines',
    'Presentation-ready files'
  ],
  true,
  'Sparkles',
  array['prod-vector-badges'],
  1
),
(
  'srv-branding',
  'Brand Identity Package',
  'Branding',
  'A complete holistic visual language system including logo system, color theory, typography, and collateral.',
  5000,
  '7–14 days',
  3,
  array[
    'Complete logo suite (primary, secondary, submarks)',
    'Curated typography hierarchy & font pairings',
    'Custom color palette (HEX, RGB, CMYK, Pantone)',
    'Brand guideline presentation (PDF)',
    'Social media profile avatars & banner kit',
    'Stationery / Business card design templates'
  ],
  true,
  'Layers',
  array['prod-branding-apex', 'prod-template-pitchdeck'],
  2
),
(
  'srv-posters',
  'Poster & Key Visuals',
  'Poster',
  'High-impact print & digital key art for concerts, events, film launches, festivals, and exhibitions.',
  2800,
  '2–5 days',
  2,
  array[
    'Print-ready 300 DPI CMYK PDF format (A1/A2/A3/Custom)',
    'Digital promo asset formatted for 1080x1350 & 16:9 displays',
    'Layered source file (PSD / AI / Affinity)',
    'Mockup presentation visuals'
  ],
  false,
  'Image',
  array['prod-template-poster', 'prod-print-swiss'],
  3
),
(
  'srv-social',
  'Social Media Graphics',
  'Social Media',
  'Eye-catching social feed templates, story graphics, podcast covers, and campaign assets that stop the scroll.',
  2200,
  '3–5 days',
  2,
  array[
    '5 customizable feed carousel / static post templates (Figma/Canva/PSD)',
    'Story highlight icons & banner graphics',
    'Export-ready web-optimized assets (PNG/WEBP)',
    'Clean grid curation recommendations'
  ],
  false,
  'Share2',
  array['prod-template-social'],
  4
),
(
  'srv-illustration',
  'Digital Illustrations',
  'Illustration',
  'Custom editorial illustrations, stylized character art, merch graphics, and multimedia concepts.',
  4000,
  '5–10 days',
  3,
  array[
    'Ultra high-resolution illustration (up to 8000px)',
    'Transparent background PNG + flat backdrop',
    'Merchandise / Apparel print-ready vector / 300 DPI export',
    'Process timelapse preview (upon request)'
  ],
  false,
  'Palette',
  array[]::text[],
  5
),
(
  'srv-books',
  'Book & Album Covers',
  'Book Covers',
  'Immersive visual storytelling on book jackets, ebook covers, vinyl sleeves, and single track artwork.',
  3800,
  '4–8 days',
  2,
  array[
    'Full jacket wrap (Front, Spine, Back) with barcode placement',
    'E-book / Spotify / Apple Music square cover artwork (3000x3000px)',
    '3D realistic book/vinyl mockup previews for marketing',
    'Print mechanical PDF with bleed specifications'
  ],
  false,
  'BookOpen',
  array[]::text[],
  6
),
(
  'srv-custom',
  'Custom Graphic Design',
  'Other',
  'Bespoke multimedia packages, creative direction, UI/UX asset kits, apparel graphics, and packaging.',
  4500,
  '5–14 days',
  3,
  array[
    'Tailored scope defined during project discussion',
    'Full editable source files with embedded assets',
    'Multi-platform output formats and specifications',
    'Direct ongoing consultation with Brewster A. Cabando'
  ],
  false,
  'Wand2',
  array[]::text[],
  7
)
on conflict (id) do nothing;

-- Seed portfolio_projects if table is empty
insert into public.portfolio_projects (
  id, title, category, short_desc, full_desc, image_url, gallery_urls,
  tools, date, client, color_palette, tags, featured, related_shop_product_ids, display_order
)
values
(
  'proj-1',
  'Aura Botanica Identity & Packaging',
  'Branding',
  'Organic apothecary brand identity featuring minimalist typography and earth-tone packaging.',
  'A comprehensive brand identity project for Aura Botanica, a sustainable botanical skincare line based in Kyoto. The system emphasizes tactile elegance, utilizing blind-embossed stationery, bespoke serif logotype, and delicate gold foil packaging accents.',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
  array[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&auto=format&fit=crop&q=80'
  ],
  array['Adobe Illustrator', 'Photoshop', 'Figma', 'Blender 3D'],
  'July 2026',
  'Aura Botanica Co.',
  array['#1C1917', '#E7E5E4', '#C2410C', '#84CC16', '#78716C'],
  array['Brand Identity', 'Packaging', 'Typography', 'Luxury Minimalist'],
  true,
  array['prod-branding-apex', 'prod-template-pitchdeck'],
  1
),
(
  'proj-2',
  'Neon Odyssey: Cyberpunk Festival Poster',
  'Poster',
  'Retro-futuristic key visual poster with heavy halftone grain and chromatic typography.',
  'Promotional key visual poster for an underground electronic audio-visual festival in Neo-Tokyo. Created with custom vector geometry, distressed risograph textures, and iridescent duotone gradients.',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=900&auto=format&fit=crop&q=80',
  array[
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80'
  ],
  array['Adobe Photoshop', 'Illustrator', 'Cinema 4D'],
  'May 2026',
  'Odyssey Live Productions',
  array['#09090B', '#F43F5E', '#06B6D4', '#E2E8F0', '#8B5CF6'],
  array['Poster Design', 'Key Visual', 'Risograph', 'Typography'],
  true,
  array['prod-print-swiss', 'prod-template-poster', 'prod-grain-textures'],
  2
),
(
  'proj-3',
  'Kroma Sound Logo & Sonic Branding',
  'Logo',
  'Dynamic waveform geometric monogram designed for an independent audio production label.',
  'Kroma Sound required an iconic, ultra-scalable mark that functions equally well as a 16px favicon, a 3D animated track bumper, or a high-end vinyl deboss.',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
  array[
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80'
  ],
  array['Adobe Illustrator', 'Glyphs', 'After Effects'],
  'April 2026',
  'Kroma Audio Labs',
  array['#0A0A0A', '#F97316', '#FAFAFA', '#52525B'],
  array['Logo Design', 'Monogram', 'Audio', 'Vector'],
  true,
  array['prod-vector-badges', 'prod-branding-apex'],
  3
),
(
  'proj-4',
  'Echoes of Solaris: Sci-Fi Novel Cover',
  'Book Covers',
  'Hardcover dust jacket & typography layout for a bestselling sci-fi planetary thriller.',
  'Full jacket design with custom digital matte painting, metallic foil stamped title typography, and comprehensive interior chapter title ornamentations.',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
  array[
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&auto=format&fit=crop&q=80'
  ],
  array['Photoshop', 'InDesign', 'Procreate'],
  'June 2026',
  'Vanguard Literary Press',
  array['#18181B', '#D97706', '#3B82F6', '#E4E4E7'],
  array['Book Cover', 'Editorial', 'Illustration', 'Print'],
  false,
  array[]::text[],
  4
),
(
  'proj-5',
  'The Solitary Drifter: Editorial Illustration',
  'Illustration',
  'Surrealistic landscape illustration exploring human connection in isolated digital worlds.',
  'Commissioned editorial piece for a technology & culture magazine essay on digital nomadism and psychological presence in the metaverse.',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80',
  array[
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80'
  ],
  array['Procreate', 'Adobe Illustrator', 'Photoshop'],
  'March 2026',
  'Epoch Magazine',
  array['#172554', '#EA580C', '#FEF08A', '#F1F5F9'],
  array['Illustration', 'Editorial', 'Surrealism', 'Digital Painting'],
  false,
  array[]::text[],
  5
),
(
  'proj-6',
  'HyperPulse Apparel & Social Campaign',
  'Social Media',
  '30-day visual social campaign toolkit and street apparel graphics for an athletic wear launch.',
  'Comprehensive launch visuals including kinetic motion story cards, animated typographic banners, product lookbook layouts, and heat-transfer garment graphics.',
  'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80',
  array[
    'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80'
  ],
  array['Figma', 'Illustrator', 'After Effects', 'Photoshop'],
  'February 2026',
  'HyperPulse Activewear',
  array['#000000', '#10B981', '#E11D48', '#FFFFFF'],
  array['Social Media', 'Apparel', 'Marketing', 'Templates'],
  false,
  array['prod-template-social'],
  6
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 6. Dedicated Public Storage Bucket: portfolio-media
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  20971520 -- 20 MB max per portfolio image
)
on conflict (id) do update set
  public = true,
  file_size_limit = 20971520;

-- Storage policies for portfolio-media
drop policy if exists "Public can view portfolio media" on storage.objects;
drop policy if exists "Admins can upload portfolio media" on storage.objects;
drop policy if exists "Admins can update portfolio media" on storage.objects;
drop policy if exists "Admins can delete portfolio media" on storage.objects;

create policy "Public can view portfolio media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

create policy "Admins can upload portfolio media"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

create policy "Admins can update portfolio media"
  on storage.objects for update
  using (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  )
  with check (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

create policy "Admins can delete portfolio media"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 7. Enable Supabase Realtime for instant synchronization across devices
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'studio_profile'
  ) then
    alter publication supabase_realtime add table public.studio_profile;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'services'
  ) then
    alter publication supabase_realtime add table public.services;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'portfolio_projects'
  ) then
    alter publication supabase_realtime add table public.portfolio_projects;
  end if;
exception
  when others then
    raise notice 'Realtime publication setup notice: %', sqlerrm;
end $$;
