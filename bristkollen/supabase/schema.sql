-- Halvhyra.se: väntelistan och ärenden.
-- Kör i Supabase → SQL Editor. Skapa projektet i en EU-region (t.ex. Stockholm eller Frankfurt).

create table if not exists public.vantelista (
  id bigint generated always as identity primary key,
  epost text not null unique check (char_length(epost) between 3 and 254),
  brist text check (
    brist in ('kyla', 'renovering', 'kok_badrum', 'buller', 'granne',
              'hiss', 'tvattstuga', 'mogel', 'vattenskada')
  ),
  postnummer text check (postnummer ~ '^[1-9][0-9]{4}$'),
  -- Vilken version av integritetspolicyn personen godkände.
  integritet_version text not null,
  skapad timestamptz not null default now()
);

comment on table public.vantelista is
  'Väntelista. Bara e-post (krävs), brist och postnummer (frivilliga). Ingen IP-adress sparas.';

-- Radnivåskydd utan policyer: ingen kan läsa eller skriva med den publika nyckeln.
-- Servern använder den hemliga nyckeln (SUPABASE_SECRET_KEY), som går förbi RLS.
alter table public.vantelista enable row level security;

-- Radera en person på begäran (GDPR):
--   delete from public.vantelista where epost = 'namn@exempel.se';

-- ---------------------------------------------------------------------------
-- Ärenden: anmälningar som vi sköter åt hyresgästen.
-- Se docs/superpowers/specs/2026-11-27-vi-skoter-arendet-design.md
drop table if exists public.anmalan cascade; -- ersatt 2026-11-27, aldrig i drift

create table if not exists public.arende (
  id uuid primary key,
  kort_id text not null unique check (kort_id ~ '^[a-z0-9]{10}$'),
  status text not null check (status in ('vantar_bekraftelse', 'skickad', 'besvarad', 'atgardad')),
  bekrafta_hash text not null unique,
  bekrafta_giltig_till timestamptz not null,
  kund_namn text not null,
  kund_epost text not null,
  kund_telefon text,
  gatuadress text not null,
  postnummer text not null,
  ort text not null,
  lagenhetsnummer text not null,
  hyresvard_namn text not null,
  hyresvard_epost text not null,
  brist text not null,
  temperatur numeric(4, 1),
  sedan date not null,
  beskrivning_kund text not null,
  beskrivning_ai text,
  amne text not null,
  brevtext text not null,
  brev_sha256 text not null,
  uppdrag_version text not null,
  skapad timestamptz not null default now(),
  skickad timestamptz,
  skickad_datum date,
  paminnelser smallint not null default 0,
  nasta_paminnelse date,
  inget_svar_meddelat boolean not null default false,
  kundfragor smallint not null default 0,
  atgardad date,
  manadshyra integer
);
create index if not exists arende_aktiva on public.arende (status) where status in ('skickad', 'besvarad');
alter table public.arende enable row level security;

-- Brevet kunden godkände, adresserna och kort_id får aldrig ändras.
create or replace function public.arende_las_brev() returns trigger language plpgsql as $$
begin
  if new.amne is distinct from old.amne
     or new.brevtext is distinct from old.brevtext
     or new.brev_sha256 is distinct from old.brev_sha256
     or new.kund_epost is distinct from old.kund_epost
     or new.hyresvard_epost is distinct from old.hyresvard_epost
     or new.kort_id is distinct from old.kort_id then
    raise exception 'Brevet och adresserna i ett ärende kan inte ändras';
  end if;
  return new;
end $$;
drop trigger if exists arende_las_brev on public.arende;
create trigger arende_las_brev before update on public.arende
  for each row execute function public.arende_las_brev();

create table if not exists public.meddelande (
  id uuid primary key,
  arende_id uuid not null references public.arende (id) on delete cascade,
  riktning text not null check (riktning in ('ut', 'in')),
  typ text not null check (typ in ('anmalan', 'paminnelse', 'kundsvar', 'hyresvardssvar', 'okand_avsandare')),
  fran text not null,
  till text not null,
  kopia text,
  amne text not null,
  text text not null,
  sha256 text not null,
  leverantor_id text unique,
  ai_sammanfattning text,
  ai_kategori text check (ai_kategori in ('lovar_atgard', 'atgardad', 'fragar', 'bestrider', 'ovrigt')),
  ai_fraga text,
  skapad timestamptz not null default now()
);
create index if not exists meddelande_arende on public.meddelande (arende_id, skapad);
alter table public.meddelande enable row level security;

-- Meddelanden är bevis och ändras aldrig.
create or replace function public.meddelande_las() returns trigger language plpgsql as $$
begin
  raise exception 'Meddelanden kan inte ändras';
end $$;
drop trigger if exists meddelande_las on public.meddelande;
create trigger meddelande_las before update on public.meddelande
  for each row execute function public.meddelande_las();

create table if not exists public.bilaga (
  id uuid primary key,
  arende_id uuid not null references public.arende (id) on delete cascade,
  meddelande_id uuid references public.meddelande (id) on delete cascade,
  kalla text not null check (kalla in ('kund', 'hyresvard')),
  filnamn text not null,
  mime text not null,
  storlek integer not null,
  sha256 text not null,
  sokvag text not null unique,
  skapad timestamptz not null default now()
);
create index if not exists bilaga_arende on public.bilaga (arende_id);
alter table public.bilaga enable row level security;

-- Privat bucket för kundens foton och hyresvärdens bilagor.
insert into storage.buckets (id, name, public) values ('bilagor', 'bilagor', false) on conflict (id) do nothing;
