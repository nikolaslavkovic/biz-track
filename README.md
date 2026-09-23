# FEROX konstrukcije — web aplikacija

Praćenje čeličnih hala, troškova i nedeljnih radnih sati.

---

## Online besplatno (Vercel) — preporučeno

Vercel hostuje ovakve app-ove **besplatno**. Dobijaš link tipa  
`https://firma-racun.vercel.app`

### Korak 1 — Kod na GitHub

1. Napravi nalog na [github.com](https://github.com) (ako nemaš)
2. **New repository** → ime npr. `firma-racun` → Create
3. Ubaci ovaj projekat u taj repo (Upload folder, ili GitHub Desktop, ili `git push`)

Ako već imaš repo na GitHubu — samo push-uj poslednji kod na `main`.

### Korak 2 — Poveži Vercel

1. Otvori [vercel.com](https://vercel.com) → **Sign up** → **Continue with GitHub**
2. **Add New… → Project**
3. Izaberi repo `firma-racun` → **Import**
4. Ostavi podrazumevano (Vite sam prepoznaje). **Deploy**
5. Sačekaj 1–2 min → klikni na link koji dobiješ

Gotovo. App je online.

### Posle toga

Svaki put kad push-uješ izmene na `main`, Vercel sam napravi novi deploy.

> Podaci i dalje ostaju **u browseru** svakog korisnika (nema deljene cloud baze). To je OK za jednu osobu / jedan telefon ili PC.

---

## Pokretanje na računaru (offline / lokalno)

1. Instaliraj [Node.js LTS](https://nodejs.org)
2. Raspakuj projekat / kloniraj repo
3. Windows: pokreni `start.bat`  
   Mac/Linux: `./start.sh` ili `npm install && npm run dev`
4. Otvori http://127.0.0.1:43127

---

## GitHub Pages (alternativa)

Može i GitHub Pages (workflow u `.github/workflows/`).  
Za početnike je **Vercel lakši** — manje podešavanja.

---

## Šta ima u app-u

- **Pregled** — prodaja, troškovi, radnici, neto + period
- **Hale** — porudžbine, boje po širini, kurs zaključan po unosu
- **Troškovi / Radnici** — unosi i nedeljni sati
