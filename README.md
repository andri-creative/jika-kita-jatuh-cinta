# Jika Kita Tak Pernah Jatuh Cinta

> A 12-scene interactive romantic animation — "Vintage Romantic Night" theme with mini-games, ambient particles, and a fireworks finale.

## About

`jika-kita-jatuh-cinta` is a multi-scene interactive love journey. Each of the 12 scenes is a unique micro-interaction (tap, hold, drag, catch) that tells part of a love story — from opening a wax-sealed envelope to a grand fireworks finale. Rewritten entirely from an earlier "45-chapter book" concept into a scene-based animation format.

## 12 Scenes

1. 💌 **Amplop Segel Lilin** — Break the wax seal to open the letter
2. ⏰ **Jam 18 Tahun** — Tap the clock 8 times, hands spin
3. 📱 **Notifikasi Malam** — Tap to receive 5 chat messages
4. 🗼 **Mercusuar Friendzone** — Hold 2s to light the lighthouse
5. 🌧 **Hujan Patah Hati** — Catch 8 falling raindrops (canvas)
6. 🗑 **Hapus Jejak Sosmed** — Drag 3 memory cards to trash
7. 🫂 **Pelukan Diri Sendiri** — Tap the heart 25 times (self-love)
8. 🌸 **Bunga Mekar Takdir** — Tap the bud 6 times to bloom
9. ✨ **Konstelasi Hati** — Tap 5 stars in order
10. ☂️ **Payung Berdua** — Drag umbrella to shelter the couple
11. 📜 **Surat Pembaca** — Write & save a letter (localStorage)
12. 🌙 **Grand Finale** — Fireworks canvas + WhatsApp share + restart

## Features

- Scene-based navigation with progress dots (`1/12`)
- Micro-interactions: tap, hold, drag, catch, type
- Web Audio API: SFX + background music (`angelbaby.mp3` with vocals)
- Ambient particle canvas (rose/gold floating dots)
- Finale fireworks canvas
- Toast notifications + haptic feedback
- localStorage: scene progress + saved letter
- Mobile-first: safe-area insets, touch targets ≥48px

## Tech Stack

- Vanilla HTML / CSS / JS
- Web Audio API (MP3 music + synth SFX)
- Canvas (rain game, fireworks, ambient particles)
- Google Fonts: Playfair Display, Caveat, Plus Jakarta Sans

## How to Run

```bash
cd jika-kita-jatuh-cinta
npx serve .
# Recommended over file:// so angelbaby.mp3 loads
```

## Project Structure

```
jika-kita-jatuh-cinta/
├── index.html       # 12 scene sections + chrome UI
├── style.css        # Vintage Romantic Night theme
├── script.js        # Engine + 12 scene interactions + audio
├── angelbaby.mp3    # Background music (with vocals)
└── PLAN.md          # Full project spec
```

## Theme

- **Palette:** Midnight Rose `#1a0b14`, Dried Rose `#b85d68`, Gilded Gold `#e6c35c`, Warm Parchment `#fcf8ef`
- **Mood:** Vintage, candlelit, melancholic-yet-hopeful
