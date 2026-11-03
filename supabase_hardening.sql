-- =====================================================================
-- RekaLOKA — Hardening (jalankan di Supabase SQL Editor)
-- 1) Rate limit sisi server (client-side saja bisa dilewati bot)
-- 2) Batas panjang field
-- 3) Tutup kebocoran email/no_hp di tabel ulasan
-- =====================================================================

-- 1+2) Trigger: maks 5 submit / jam / IP, dan maks 3 / jam / email
create or replace function public.rk_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ip text := coalesce(
    split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), 'unknown');
  n_ip int; n_mail int;
begin
  if length(new.nama) > 100 or length(new.email) > 150 or length(new.no_hp) > 30 then
    raise exception 'Input terlalu panjang';
  end if;
  if tg_table_name = 'kemitraan' and length(new.keterangan) > 2000 then
    raise exception 'Keterangan terlalu panjang';
  end if;

  new.ip_hash := md5(ip);
  execute format('select count(*) from public.%I where ip_hash = $1 and created_at > now() - interval ''1 hour''', tg_table_name)
    into n_ip using new.ip_hash;
  execute format('select count(*) from public.%I where lower(email) = lower($1) and created_at > now() - interval ''1 hour''', tg_table_name)
    into n_mail using new.email;

  if n_ip >= 5 or n_mail >= 3 then
    raise exception 'Terlalu banyak percobaan. Coba lagi nanti.' using errcode = 'P0001';
  end if;
  return new;
end $$;

alter table public.kemitraan add column if not exists ip_hash text;
alter table public.ulasan    add column if not exists ip_hash text;

drop trigger if exists rk_rl_kemitraan on public.kemitraan;
create trigger rk_rl_kemitraan before insert on public.kemitraan
  for each row execute function public.rk_rate_limit();

drop trigger if exists rk_rl_ulasan on public.ulasan;
create trigger rk_rl_ulasan before insert on public.ulasan
  for each row execute function public.rk_rate_limit();

-- 3) anon hanya boleh baca kolom rating (cukup untuk hitung rata-rata)
revoke select on public.ulasan from anon;
grant  select (rating, created_at) on public.ulasan to anon;
