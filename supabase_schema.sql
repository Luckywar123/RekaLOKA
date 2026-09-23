-- =====================================================================
-- RekaLOKA — Supabase Schema
-- Jalankan script ini di: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

-- Pastikan extension untuk uuid tersedia
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1) TABEL: kemitraan
--    Menyimpan pengajuan kemitraan/partnership dari form di section
--    #kemitraan (nama, email, no HP, keterangan project)
-- =====================================================================
create table if not exists public.kemitraan (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  email       text not null,
  no_hp       text not null,
  keterangan  text not null,
  created_at  timestamptz not null default now()
);

alter table public.kemitraan enable row level security;

-- Siapa saja (pengunjung website) boleh mengirim/insert data
create policy "kemitraan_public_insert"
  on public.kemitraan
  for insert
  to anon
  with check (true);

-- (Tidak ada policy select untuk anon → data hanya bisa dibaca
--  lewat Supabase Dashboard oleh kamu sebagai pemilik project)


-- =====================================================================
-- 2) TABEL: ulasan
--    Menyimpan feedback / rating bintang dari pengunjung
--    (nama, email, no HP, rating 1-5)
-- =====================================================================
create table if not exists public.ulasan (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  email       text not null,
  no_hp       text not null,
  rating      smallint not null check (rating between 1 and 5),
  created_at  timestamptz not null default now()
);

alter table public.ulasan enable row level security;

-- Siapa saja boleh mengirim ulasan
create policy "ulasan_public_insert"
  on public.ulasan
  for insert
  to anon
  with check (true);

-- Siapa saja boleh membaca rating (dibutuhkan untuk menghitung
-- rata-rata bintang yang ditampilkan di halaman)
create policy "ulasan_public_select"
  on public.ulasan
  for select
  to anon
  using (true);


-- =====================================================================
-- (Opsional) View untuk melihat ringkasan rata-rata rating langsung
-- dari SQL Editor / dashboard, tanpa perlu hitung manual.
-- =====================================================================
create or replace view public.ulasan_ringkasan as
select
  count(*)                          as total_ulasan,
  round(avg(rating)::numeric, 2)    as rata_rata_rating
from public.ulasan;
