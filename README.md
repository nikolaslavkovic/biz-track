# FirmaRačun

Web aplikacija za praćenje **troškova, radnih sati, materijala i zarade** u firmi.

## Šta radi

- **Projekti** — naziv, klijent, početak/završetak, status, prihod
- **Troškovi** — dnevni materijal (cevi, farba, žica…), mesečni (struja, porez…), plate, ostalo
- **Radnici i sati** — satnica radnika + **nedeljni unos sati** (isplata na kraju nedelje) + pregled po nedeljama
- **Pregled** — ukupna zarada, troškovi, neto, **neto zarada po satu**, grafikoni kroz mesece
- Podaci se čuvaju u lokalnoj **SQLite** bazi (`data/firma.db`) — ostaju nedeljama i mesecima

## Pokretanje

```bash
npm install
npm run build
npm run start
```

Za razvoj: `npm run dev -- --port 43127`

Aplikacija sluša na [http://127.0.0.1:43127](http://127.0.0.1:43127).

Pri prvom pokretanju automatski se učitava primer podataka (projekti, radnici, troškovi) da odmah vidiš grafikone. Možeš ih obrisati i unositi svoje.

## Tehnologije

- Next.js (App Router) + TypeScript + Tailwind
- SQLite preko `better-sqlite3` + Drizzle ORM
- Recharts za grafikone

## Napomena o računici

- **Zarada** = zbir prihoda sa projekata
- **Trošak rada** = sati × satnica (ako niste posebno unosili plate kao trošak)
- **Neto** = zarada − (materijal + mesečni + ostalo + rad)
- **Neto po satu** = neto ÷ ukupni radni sati
