# FirmaRačun — web aplikacija

Praćenje čeličnih hala, troškova i nedeljnih radnih sati. Radi u browseru na računaru i telefonu.

- Unosi se **pamte u browseru** (ne treba posebna baza)
- Jezik: srpski

---

## Pokretanje na računaru (Windows)

1. Instaliraj **[Node.js LTS](https://nodejs.org)** (klikni LTS → Next → Finish)
2. Raspakuj folder `FirmaRacun-lokalno.zip` gde želiš (npr. Desktop)
3. Dupli klik na **`start.bat`**
4. Sačekaj da piše `Local: http://localhost:43127/`
5. Otvori Chrome i idi na: **http://127.0.0.1:43127**

Zaustavljanje: u crnom prozoru pritisni `Ctrl + C`, pa Enter.

> Prvi put `start.bat` radi `npm install` (može da potraje 1–2 min). Posle toga kreće brže.

### Ručno (ako baš hoćeš)

```bash
npm install
npm run dev
```

---

## Šta ti treba za „bazu“ (početnički)

**Ništa posebno.** Podaci se čuvaju u browseru (IndexedDB).

| Pitanje | Odgovor |
|---|---|
| Gde su podaci? | U Chrome/Edge na **tom** računaru |
| Drugi računar / telefon? | Druga kopija (nema automatskog sync-a) |
| Brisanje podataka sajta? | Briše unose |

---

## Hostovanje na GitHub Pages (kasnije)

Aplikacija je statički sajt. Workflow je u `.github/workflows/deploy-pages.yml`.

- Project site: `https://USER.github.io/REPO/#/`
- Custom domain: u workflow stavi `BASE_PATH: /`

Detalji u ranijem uputstvu ispod / u Settings → Pages → GitHub Actions.

---

## Šta ima u app-u

- **Pregled** — prodaja, troškovi, radnici, neto + period (ukupno/nedeljno/mesečno/godišnje)
- **Hale** — porudžbine po redu, boje po širini, kurs zaključan po unosu
- **Troškovi** — materijal, mesečni, ostalo
- **Radnici** — nedeljni sati

## Build (opciono)

```bash
npm run build
npm run preview
```
