-- ═══════════════════════════════════════════════════════════════════════
--  EFFORTLESS EDUCATION — DATABASE SETUP
--  ---------------------------------------------------------------------
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--  You only ever do this once.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;


-- ── Group classes, one row per course per month ────────────────────────
create table if not exists group_classes (
  id          uuid primary key default gen_random_uuid(),
  month       text not null,                    -- '2026-10'
  name        text not null,
  fee         integer not null default 0,       -- what the STUDENT pays
  schedule    text not null default '',         -- 'Mon & Wed, 6:00–8:00 PM'
  start_date  date,
  seats       text not null default '',         -- '4 places left'
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists group_classes_month_idx on group_classes (month);


-- ── Teachers shown on the website ──────────────────────────────────────
-- Note what is NOT here: no phone, no email, no pay. Those live in
-- teacher_submissions below, which the public can never read.
create table if not exists teachers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  course        text not null default 'general',   -- 'general' or 'ielts'
  levels        text[] not null default '{}',
  platform      text not null default 'Zoom',
  blurb         text not null default '',
  availability  jsonb not null default '[]'::jsonb,
  status        text not null default 'pending',   -- 'pending' or 'live'
  sort_order    integer not null default 0,
  updated_at    timestamptz not null default now()
);


-- ── What teachers send you through the website ─────────────────────────
-- Anyone may add a row here. Nobody except you may read one.
create table if not exists teacher_submissions (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null default 'new',    -- 'new' or 'update'
  name              text not null,
  phone             text not null default '',
  email             text not null default '',
  telegram          text not null default '',
  courses           text not null default '',
  blurb             text not null default '',
  availability_text text not null default '',
  fee_request       text not null default '',       -- what THEY want paid. Private.
  handled           boolean not null default false,
  created_at        timestamptz not null default now()
);


-- ── Student reviews ────────────────────────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  name        text not null,
  course      text not null default '',
  rating      integer not null default 5 check (rating between 1 and 5),
  status      text not null default 'pending',      -- 'pending' or 'approved'
  created_at  timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════
--  SECURITY RULES
--  Without these, anyone could edit your prices. With them, a visitor can
--  only read what you have approved, and only you can change anything.
-- ═══════════════════════════════════════════════════════════════════════

alter table group_classes       enable row level security;
alter table teachers            enable row level security;
alter table teacher_submissions enable row level security;
alter table reviews             enable row level security;

-- Visitors read only what is published ---------------------------------
drop policy if exists "read visible group classes" on group_classes;
create policy "read visible group classes"
  on group_classes for select to anon
  using (visible = true);

drop policy if exists "read live teachers" on teachers;
create policy "read live teachers"
  on teachers for select to anon
  using (status = 'live');

drop policy if exists "read approved reviews" on reviews;
create policy "read approved reviews"
  on reviews for select to anon
  using (status = 'approved');

-- Visitors may send you things, but never read them back ---------------
drop policy if exists "anyone may apply to teach" on teacher_submissions;
create policy "anyone may apply to teach"
  on teacher_submissions for insert to anon
  with check (char_length(name) between 2 and 120);

drop policy if exists "anyone may leave a review" on reviews;
create policy "anyone may leave a review"
  on reviews for insert to anon
  with check (
    status = 'pending'
    and char_length(quote) between 10 and 1200
    and char_length(name) between 1 and 80
  );

-- You, signed in, may do anything ---------------------------------------
drop policy if exists "admin group classes" on group_classes;
create policy "admin group classes"
  on group_classes for all to authenticated using (true) with check (true);

drop policy if exists "admin teachers" on teachers;
create policy "admin teachers"
  on teachers for all to authenticated using (true) with check (true);

drop policy if exists "admin submissions" on teacher_submissions;
create policy "admin submissions"
  on teacher_submissions for all to authenticated using (true) with check (true);

drop policy if exists "admin reviews" on reviews;
create policy "admin reviews"
  on reviews for all to authenticated using (true) with check (true);


-- ═══════════════════════════════════════════════════════════════════════
--  STARTING DATA — your current teachers, so the site is not empty
-- ═══════════════════════════════════════════════════════════════════════

insert into teachers (name, course, levels, platform, blurb, availability, status, sort_order)
values
  ('Phyu Phyu Thant', 'general', '{basic,preInt,int}', 'Zoom',
   'Builds overall proficiency across the four skills using the Headway coursebook.',
   '[{"day":"Monday to Friday","times":"8:00 AM – 1:00 PM"}]'::jsonb, 'live', 1),

  ('Thin Thandar Zaw', 'general', '{basic,preInt,int,upperInt}', 'Zoom',
   'Headway textbook across all four skills, from Basic through to Upper-Intermediate.',
   '[{"day":"Monday","times":"8:00–10:00 AM, 6:00–8:00 PM"},
     {"day":"Tuesday","times":"8:00 AM–3:00 PM, 5:00–8:00 PM"},
     {"day":"Wednesday","times":"6:00–9:00 PM"},
     {"day":"Thursday","times":"1:00–3:00 PM, 5:00–9:00 PM"},
     {"day":"Friday","times":"8:00–10:00 AM, 6:00–9:00 PM"},
     {"day":"Saturday","times":"1:00–5:00 PM"},
     {"day":"Sunday","times":"8:00 AM–5:00 PM"}]'::jsonb, 'live', 2),

  ('Hay Mar Thet', 'general', '{basic,preInt,int}', 'Zoom',
   'Teaches every day of the week, evenings only.',
   '[{"day":"Every day","times":"7:00–9:00 PM"},
     {"day":"Every day","times":"9:00–11:30 PM","onRequest":true}]'::jsonb, 'live', 3),

  ('Kaung Myat Chit', 'general', '{basic,preInt,int,upperInt}', 'Zoom',
   'Focused on practical communication, grammar and vocabulary.',
   '[{"day":"Monday & Tuesday","times":"5:00–8:00 PM"},
     {"day":"Wednesday & Sunday","times":"5:00–7:00 PM"}]'::jsonb, 'live', 4),

  ('Htoo Myat Eaindray', 'ielts', '{foundation,testPrep}', 'Zoom',
   'Foundation covers the test format with Reading and Listening practice. Preparation moves on to full review and analysis.',
   '[{"day":"Mon to Wed","times":"8:00 AM–12:00 PM, 2:00–4:00 PM, 8:00–9:00 PM"},
     {"day":"Thursday","times":"8:00 AM–12:00 PM, 2:00–3:00 PM, 8:00–9:00 PM"},
     {"day":"Friday","times":"8:00–11:00 AM, 2:00–4:00 PM, 8:00–9:00 PM"},
     {"day":"Sat & Sun","times":"2:00–4:00 PM"}]'::jsonb, 'live', 5)
on conflict do nothing;
