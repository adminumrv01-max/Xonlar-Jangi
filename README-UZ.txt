XONLAR JANGI — ANDROID APK LOYIHASI

LOYIHA NIMA QILADI?
- Siz yuborgan xonlar-jangi.html fayli Android ilovasining ichiga joylangan.
- O'yin WebView ichida ochiladi va ekran to'liq ishlatiladi.
- JavaScript va localStorage yoqilgan: brauzerda saqlanadigan sozlamalar/profil qurilmada saqlanishi mumkin.
- Internet ruxsati bor: o'yinning mavjud serveri ishlasa, online funksiyalar ulanishi mumkin.
- Offline/yakka o'yin HTML fayl ichidagi mavjud imkoniyatlar bilan ishlaydi.

KOMPYUTERDA APK YIG'ISH
1. Android Studio o'rnating.
2. Shu papkani Android Studio'da Open orqali oching.
3. Gradle Sync tugashini kuting.
4. Build > Build Bundle(s) / APK(s) > Build APK(s) ni tanlang.
5. APK: app/build/outputs/apk/debug/app-debug.apk

TELEFONDA APK YIG'ISH (GITHUB ACTIONS ORQALI)
1. GitHub'da yangi repository yarating.
2. ZIP ichidagi loyiha fayllarini repository'ga yuklang (ZIPning o'zini emas, ichidagi fayllarni).
3. Repository'da Actions bo'limini oching.
4. "Build Xonlar Jangi APK" workflow'ini tanlab Run workflow bosing.
5. Jarayon tugagach, run sahifasining Artifacts qismidan Xonlar-Jangi-debug-APK ni yuklab oling.
6. APKni telefonda ochib o'rnating. Android noma'lum manbadan o'rnatishga ruxsat so'rashi mumkin.

MUHIM
- Telefonning o'zida oddiy Acode HTML muharriri APK kompilyatsiya qilmaydi. Yuqoridagi GitHub Actions usuli telefon brauzeridan ham ishlaydi.
- Online multiplayer serverga bog'liq. HTML ichidagi standart manzil: https://xonlar-jangi.onrender.com . Server uxlab qolgan, o'chgan yoki noto'g'ri sozlangan bo'lsa, online rejim ulanmasligi mumkin; offline o'yin alohida ishlashi kerak.
- Bu debug APK. Boshqalarga tarqatish uchun keyin release signing kerak bo'ladi.
