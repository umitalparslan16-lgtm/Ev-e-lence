# Hüdhüd ile Kur'an

6-7 yaşındaki çocuklar için, telefonda çalışan, oyun tarzında Kur'an okuma uygulaması (web/PWA).
Elif Ba'yı bitirip Kur'an'a yeni başlayan bir çocuğun **dinleyerek, kendi sesini kaydederek ve kelime
oyunlarıyla** ilerlemesi için tasarlandı. Reklam yok, hesap yok; kayıtlar yalnızca telefonda kalır.

## İçerik (ilk sürüm)

| Durak | Sayfa | Ayetler |
|---|---|---|
| 1 | Fâtiha | 1:1–7 |
| 2 | Bakara'nın 1. sayfası | besmele + 2:1–5 |
| 3 | Bakara'nın 2. sayfası | 2:6–16 |

Her durakta üç bölüm vardır; her biri bir ⭐ verir, 3 ⭐ sonraki durağı açar:

- **🎧 Dinle**: Husarî'nin öğretici (muallim) kıraati; okunan kelime sarı renkle ilerler. Yavaş hız seçeneği,
  kelimeye dokununca tek kelimenin okunuşu, ayet numarasına dokununca oradan başlama.
- **🎙️ Oku**: Çocuk ayet ayet kendi sesini kaydeder ve geri dinler. Otomatik ses denetimi yoktur.
- **🎮 Oyna**: Sayfanın kendi kelimeleriyle 6 soruluk tur: benzer harfler (ب/ت, ح/خ, س/ص…), şeddeli/cezimli
  kelimeyi bulma, duyduğu kelimeyi bulma. Yanlışta ceza yok; Hüdhüd yumuşakça tekrar ettirir.

Yıldızlar bahçede çiçek/ağaç ekmeye harcanır. Ebeveynin onayladığı her ayet kaydı bir 🌟 altın yıldız verir;
altın yıldızlarla kedi yavrusuna hediye alınır. Ebeveyn onayı ilerlemek için şart değildir.

**Ebeveyn köşesi** (👪, çarpma sorusuyla açılır): kayıtları dinleme ve onaylama, Hüdhüd'ün cümlelerini kendi
sesinizle kaydetme, kâri seçimi, günlük süre, yazı boyu, şedde/cezim renklendirme (yardım modu).

## Hüdhüd'ün sesi

Hüdhüd'ün cümleleri `data/hudhud-lines.json` dosyasındadır. Yayın sırasında GitHub Actions bu cümleleri
Microsoft Edge'in sinirsel Türkçe sesiyle (**tr-TR-EmelNeural**) MP3'e çevirir (`scripts/gen-voice.py`).
Ses, hız, ton ve çocuğun adı `data/voice-config.json` dosyasından değiştirilir. Çalma sırası:
ebeveynin kendi kaydı → hazır ses → telefonun yapay sesi.

## Kur'an metni hakkında

Metin, Tanzil metni kelime kelime temel alınarak **Türkiye (Diyanet) mushaf imlasına** elle uyarlandı:
elifte hemze yok (اَنْعَمْتَ), yuvarlak cezim, çeker (اللّٰهِ ، الرَّحْمٰنِ), uzatma yerlerinde dik esre (الرَّح۪يمِ),
ihfa/idgam nunlarında cezim (يُنْفِقُونَ). Kaynak: `data/mushaf-tr.txt`. Derleme betiği her ayetin kelime
sayısını Tanzil referansıyla ve ses zamanlamasıyla karşılaştırır.

> Lütfen ekrandaki metni kendi mushafınızla karşılaştırın; fark görürseniz `data/mushaf-tr.txt` dosyasında
> düzeltilebilir.

## Geliştirme

```bash
npm install
npm run data         # data/ → src/data/quran.json
npm run fetch-audio  # sesleri public/audio/ içine indirir (internet gerekir)
npm run dev
npm run build        # dist/ + çevrimdışı çalışma için sw.js
```

Ses dosyaları depoya konmaz; GitHub Actions derleme sırasında indirip uygulamaya gömer (`.github/workflows/pages.yml`).
Gömülü dosya bulunamazsa uygulama aynı sesi internetteki kaynaktan çalar.

## Yayın (GitHub Pages)

Depo ayarlarında **Settings → Pages → Build and deployment → Source: GitHub Actions** seçilmelidir.
Her gönderimde uygulama `https://<kullanıcı>.github.io/<depo>/` adresinde güncellenir. Telefonda Chrome ile açıp
menüden **Ana ekrana ekle** dendiğinde uygulama gibi açılır ve internetsiz çalışır.

## Kaynaklar ve lisanslar

- Kur'an metni: [Tanzil](https://tanzil.net) (metin değiştirilmeden kullanılmak şartıyla serbest; burada imla Türk mushafına uyarlanmıştır).
- Kıraat: Mahmud Halil el-Husarî (muallim) ve Muhammed Sıddık el-Minşâvî (öğretici, çocuklarla), [everyayah.com](https://everyayah.com).
- Kelime sesleri: [Quran.com](https://quran.com) kelime kelime ses kayıtları.
- Kelime zamanlaması: [quran-align](https://github.com/cpfair/quran-align), Collin Fair, CC BY 4.0 (`data/timing-husary-muallim.json`).
- Yazı tipi: [Scheherazade New](https://software.sil.org/scheherazade/), SIL, Open Font License.
