# Xonlar jangi

Cossacks 3 uslubidagi o'zbekcha brauzer RTS o'yini (piksel grafika, telefon va kompyuter).
Xonliklar: Qo'qon, Buxoro, Xorazm, Qozoq. Botlarga qarshi yoki onlayn (4 kishigacha, xona kodi bilan).

## Ishga tushirish
    node server.js        # http://localhost:3000   (faqat Node.js 16+, paket o'rnatish shart emas)

Railway / Render: shu papkani yuklang, Start buyrug'i `npm start`. PORT avtomatik olinadi.
Profillar `data/profiles.json` da saqlanadi (Railway'da doimiy Volume ulab DATA_DIR=/data qiling).

## Fayllar
- server.js — HTTP + WebSocket (xonalar, profil API)
- public/sim.js — o'yin mantig'i (xarita, iqtisod, jang, bot AI)
- public/sprites.js — piksel sprite'lar (kod bilan chiziladi)
- public/client.js — menyu, boshqaruv, grafika, ovoz, tarmoq
- public/i18n.js — O'zbekcha / Русский / English
