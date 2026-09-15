# FirmaRačun (offline na telefonu)

Aplikacija za praćenje **čeličnih hala, troškova i nedeljnih radnih sati**.

Podaci se čuvaju **u browseru na uređaju** (IndexedDB) — **ne zavise od računara**. Posle prvog otvaranja radi i **offline**.

## Pokretanje na računaru (za razvoj / prvi put)

Treba ti [Node.js LTS](https://nodejs.org).

```bash
npm install
npm run dev
```

Otvori http://127.0.0.1:43127

Za produkcijski build:

```bash
npm run build
npm run preview
```

## Kako na Android telefonu (browser / kao app)

### Varijanta A — najjednostavnija (preporuka)

1. Na računaru pokreni `npm run build && npm run preview` (ili hostuj `dist/` folder besplatno, npr. Netlify / Cloudflare Pages).
2. Na telefonu, **istom WiFi-u**, otvori Chrome i uđi na adresu tipa:
   - `http://IP-ADRESA-RAČUNARA:43127`  
   (IP vidiš u Windows: `ipconfig`, na Mac/Linux: `ifconfig` / `ip a`)
3. U Chrome meniju (⋮) izaberi **„Dodaj na početni ekran“** / **Install app**.
4. Posle toga otvaraš ikonicu kao aplikaciju. Podaci ostaju **na telefonu**. Radi i bez WiFi-ja (offline).

### Varijanta B — potpuno bez računara dugoročno

1. Uradi `npm run build`
2. Uploaduj sadržaj foldera `dist/` na besplatan hosting (Cloudflare Pages, Netlify, GitHub Pages)
3. Otvori taj link jednom u Chrome-u na telefonu
4. **Dodaj na početni ekran**
5. Dalje koristi offline; podaci su lokalno na telefonu

> Važno: brisanje podataka Chrome-a / „Clear storage“ briše i tvoje unose. Ne briši podatke sajta ako hoćeš da sačuvaš istoriju.

## Šta ima u aplikaciji

- **Projekti / hale** — Š×D×V, krov jedna/dve vode, klijent + telefon, cena u RSD ili EUR
- **Troškovi** — materijal, mesečni, ostalo
- **Radnici** — nedeljni sati i isplata
- **Pregled** — neto, grafikoni, hale po širini

## Tehnologije

Vite + React + Tailwind + Dexie (IndexedDB) + PWA (service worker)
