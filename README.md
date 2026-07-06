# Content OS

Monitenantti, AI-pohjainen markkinointi- ja sisältöjärjestelmä. Ensimmäinen tenant on **Savuks Oy**; järjestelmä on suunniteltu alusta asti monelle yritykselle.

Tämä on **Vaihe 1** — runko, design system, tyypit, data-kerros (mock + Postgres-valmius) ja dashboard. AI-toiminnot (Vision, sisällöntuotanto, video, SEO) tulevat myöhemmissä vaiheissa.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 3.4**, design-tokenit CSS-muuttujina
- **PostgreSQL** Railwayllä `pg`-kirjastolla (aktivoituu vain kun `DATABASE_URL` on asetettu)
- **Mock-tila:** `NEXT_PUBLIC_USE_MOCK_DATA=true` → sovellus toimii ilman kantaa
- Deploy: Railway (NIXPACKS), GitHub-repo → auto-deploy

## Pika-aloitus (mock-data)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Avaa http://localhost:3000. Login-sivulla klikkaa **"Jatka demona"** → siirryt dashboardiin mock-datalla.

## Skriptit

- `npm run dev` — dev-palvelin
- `npm run build` — tuotantobuildi
- `npm run start` — tuotantobuildin ajo
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — Next.js lint

## Railway-käyttöönotto

1. Työnnä repo GitHubiin, kytke Railwayhin (NIXPACKS).
2. Lisää **Postgres-palvelu** — Railway asettaa `DATABASE_URL` automaattisesti.
3. Aseta `NEXT_PUBLIC_USE_MOCK_DATA=false` service Variables -välilehdellä.
4. Deploy alustaa skeeman ensimmäisessä käynnistyksessä (`db/schema.sql`).

## Rakenne

```
app/
  (app)/                  App shell (sidebar + topbar + command palette)
    dashboard/            Bento-grid: KPIt, jono, kalenteri, media
    layout.tsx
  (auth)/
    login/                Demo-kirjautuminen
  layout.tsx              Fontit + globals
  page.tsx                → redirect /dashboard
  globals.css             Design-tokenit + skeleton + scrollbar
components/
  ui/                     button, card, badge (+ StatusPill), empty-state,
                          skeleton (+ ComingSoon), page-header
  app-shell/              sidebar, topbar, tenant-switcher,
                          command-palette (⌘K), nav-links
lib/
  types.ts                Kaikki tyypit
  utils.ts                cn(), formatDate(), formatCompact()
  nav.ts                  NAV_ITEMS (lucide-ikoneilla)
  tenant.ts               getTenantContext(), evästepohjainen orgin valinta
  actions/tenant.ts       "use server" switchTenant()
  data.ts                 Async-getterit (mock nyt, Postgres myöhemmin)
  mock/data.ts            Savuks-brändi + demo-org
  db/index.ts             pg-Pool + initSchema()
db/
  schema.sql              Idempotentti monitenantti skeema
middleware.ts             Placeholder (auth tulee myöhemmin)
tailwind.config.ts        Väri-mäppäys CSS-muuttujiin
tsconfig.json             strict, @/* → ./*
next.config.mjs           images.unsplash.com sallittu
.env.example              Ympäristömuuttujat
```

## Roolit ja tenantit

- Roolit: `owner` / `admin` / `editor` / `reviewer` / `viewer` (`ROLE_RANK` + `hasRole()`)
- Aktiivinen organisaatio valitaan **evästeestä** `content-os-active-org`
- Tenant switcher (sidebar) → `switchTenant(orgId)` server action + `revalidatePath("/")`

## Design-tokenit

```
--bg-base       #0a0a0b   pohja
--bg-surface    #141416   kortin tausta
--bg-surface-2  #1c1c20   syvempi taso (KPI-cellit, badges)
--accent-from   #6366f1   indigo
--accent-to     #8b5cf6   violetti
```

Aksentti = `linear-gradient(135deg, accent-from, accent-to)`. `text-gradient`-luokka valuu tekstille.

## Mitä seuraavaksi

- **Vaihe 2:** Media-välilehti (Vision AI:lla analyysi + tagit), Brand Brain
- **Vaihe 3:** Generator (multi-channel content synthesis), Kalenteri
- **Vaihe 4:** Analytics-integraatiot, Asetukset, oikea auth

## Vastuunrajaus

Tämä on **sisäinen työkalu**, ei julkinen verkkosivu. Kirjautuminen ja Auth-lisäkerros tulee myöhemmin (Vaihe 4). Mock-tilassa `/dashboard` on avoin — käytä vain paikallisesti tai suojatun verkon takana.
