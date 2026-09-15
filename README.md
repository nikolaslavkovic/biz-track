# FirmaRačun — Android + offline

Aplikacija za čelične hale, troškove i nedeljne radne sate.

- **Offline** — podaci ostaju na telefonu (IndexedDB)
- **APK** — instalacija bez Play Store-a
- Radi i kao PWA u Chrome-u

## Podešavanja aplikacije

| Polje | Vrednost |
|---|---|
| Ime | FirmaRačun |
| Package ID | `com.firma.racun` |

## Instalacija APK na Android (bez Play Store)

1. Preuzmi fajl **`FirmaRacun.apk`**
2. Prebaci ga na telefon (USB, Drive, Telegram sebi…)
3. Na telefonu: **Podešavanja → Bezbednost** → dozvoli instalaciju iz nepoznatih izvora / za taj folder (Files, Chrome…)
4. Otvori `FirmaRacun.apk` → **Instaliraj**
5. Otvori ikonicu **FirmaRačun**

Posle toga **ne treba internet ni računar**. Sve što uneseš ostaje na telefonu.

> Ne briši podatke aplikacije u Android podešavanjima ako hoćeš da sačuvaš unose.

## Ponovno pravljenje APK (na računaru)

Treba: [Node.js LTS](https://nodejs.org) + [Android Studio](https://developer.android.com/studio) (ili Android SDK).

```bash
npm install
npm run android:sync
npm run android:open
```

U Android Studio: **Build → Build APK(s)**.

Ili iz terminala (ako je SDK podešen):

```bash
npm run android:build
```

APK će biti u:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Razvoj u browseru

```bash
npm install
npm run dev
```

Otvori http://127.0.0.1:43127

## Šta ima u app-u

- **Projekti / hale** — Š×D×V, krov, klijent + telefon, cena RSD/EUR
- **Troškovi** — materijal, mesečni, ostalo
- **Radnici** — nedeljni sati i isplata
- **Pregled** — neto, grafikoni, hale po širini
