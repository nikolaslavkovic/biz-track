# FirmaRačun — web aplikacija

Praćenje čeličnih hala, troškova i nedeljnih radnih sati. Radi u browseru (telefon i računar), može se hostovati na **GitHub Pages**.

- Unosi se **pamte automatski** u browseru (nema posebne registracije za bazu)
- Radi i **offline** (PWA) kad jednom učitaš sajt
- Jezik interfejsa: srpski

---

## Šta ti treba za „bazu“ (početnički)

**Ne moraš da otvaraš MySQL, Firebase ni ništa slično** da bi aplikacija pamtila unose.

| Pitanje | Odgovor |
|---|---|
| Gde se čuvaju podaci? | U **browseru** (IndexedDB), na tom uređaju i u tom Chrome/Safari/Firefox-u |
| Moraš li da platiš bazu? | **Ne** — već je ugrađeno |
| Moraš li da napraviš nalog? | **Ne** |
| Vide li se podaci na telefonu i PC odjednom? | **Ne automatski** — svaki browser ima svoju kopiju |
| Šta briše podatke? | Brisanje podataka sajta u browseru, drugi browser, drugi telefon, privatni/incognito režim |

To je dovoljno za jednu firmu / jedan telefon ili jedan računar.

### Kad bi ti trebala „prava“ cloud baza?

Samo ako želiš npr.:

- isti podaci na telefonu **i** na računaru odjednom
- više ljudi da unosi istovremeno
- rezervnu kopiju na internetu

Onda bi kasnije dodali npr. **Supabase** ili **Firebase** (besplatan početni nivo). Za sada **nije potrebno** — aplikacija već pamti unose lokalno.

---

## Pokretanje lokalno (test)

Treba: [Node.js LTS](https://nodejs.org)

```bash
npm install
npm run dev
```

Otvori http://127.0.0.1:43127

---

## Hostovanje na GitHub Pages (tvoj sajt na GitHubu)

Aplikacija je **statički sajt** (HTML/JS/CSS). GitHub Pages to savršeno hostuje — **nema servera** koji drži bazu; baza je u browseru posetilaca.

### Korak 1 — Ubaci kod u GitHub repo

1. Napravi (ili otvori) repo na GitHubu gde ti je sajt, ili poseban repo samo za ovu app.
2. Push-uj ovaj projekat na granu `main`.

### Korak 2 — Uključi GitHub Pages

1. Na GitHubu: **Settings → Pages**
2. **Source**: **GitHub Actions**
3. Sačuvaj

U projektu već postoji workflow: `.github/workflows/deploy-pages.yml`  
Pri svakom push-u na `main` automatski build-uje i objavljuje sajt.

### Korak 3 — Adresa sajta

- **Project site** (podrazumevano u workflow-u):  
  `https://TVOJ-USER.github.io/IME-REPA/#/`  
  Primer: repo `firmaračun` → `https://nikola.github.io/firmaračun/#/`

- **Custom domain** (npr. `www.mojfirma.rs`) ili **user site** (`username.github.io`):  
  u workflow fajlu promeni build na:

  ```yaml
  env:
    BASE_PATH: /
  ```

  pa ponovo push-uj `main`.

### Korak 4 — Provera

Posle 1–2 minuta: **Actions** tab → zeleni deploy → otvori link.  
Trebalo bi da vidiš FirmaRačun. Unesi projekat / trošak — osveži stranicu: podaci ostaju.

> URL koristi `#/` (HashRouter) da GitHub Pages ne „izgubi“ rute tipa `/projekti`.

---

## Ako već imaš postojeći sajt na GitHubu

Dve jednostavne opcije:

1. **Poseban repo** samo za FirmaRačun → link sa glavnog sajta: „Računovodstvo“ → `https://…github.io/firma-racun/#/`
2. **Isti repo** — zameni sadržaj ovim projektom (ili stavi u podfolder i podesi `BASE_PATH` na taj folder)

Za početak je najlakše **poseban repo + link** sa početne strane.

---

## Šta ima u aplikaciji

- **Projekti / hale** — Š×D×V, krov, klijent + telefon, cena RSD/EUR
- **Troškovi** — materijal, mesečni, ostalo
- **Radnici** — nedeljni sati i isplata
- **Pregled** — neto, grafikoni, hale po širini
- Kurs EUR→RSD u podešavanjima (podrazumevano 117)

---

## Build bez deploy-a

```bash
npm run build
# rezultat u folderu dist/ — to se uploaduje na Pages
```

Za lokalni test production build-a:

```bash
npm run preview
```
