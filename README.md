# QuranGSheet-API

API Al-Quran berbasis Google Apps Script dengan Google Spreadsheet sebagai database.

## 📖 Tentang Proyek

QuranGSheet-API adalah solusi ringan untuk menyediakan akses terhadap data Al-Quran melalui REST API. Proyek ini memanfaatkan kekuatan Google Apps Script dan Google Spreadsheet sebagai database, menjadikannya solusi yang mudah di-deploy dan dikelola tanpa memerlukan infrastruktur server yang kompleks.

### Fitur Utama

- ✅ Akses lengkap ke 114 surah Al-Quran
- ✅ Dukungan teks Arab, Latin, dan terjemahan
- ✅ Pencarian kata kunci dalam Al-Quran
- ✅ Akses berdasarkan juz dan halaman
- ✅ Dukungan URL audio untuk setiap ayat
- ✅ Sistem caching untuk performa optimal
- ✅ Analytics untuk melihat penggunaan API

## 🚀 Cara Menggunakan

### Endpoint API

1. **Daftar Semua Surah**
   ```
   ?action=getAllSurah
   ```

2. **Mendapatkan Satu Surah**
   ```
   ?action=getSurah&number=1
   ```

3. **Mendapatkan Satu Ayat**
   ```
   ?action=getAyat&surah=1&ayat=1
   ```

4. **Pencarian Kata Kunci**
   ```
   ?action=search&q=keyword
   ```

5. **Mendapatkan Ayat dalam Juz**
   ```
   ?action=getJuz&number=1
   ```

6. **Mendapatkan Ayat dalam Halaman**
   ```
   ?action=getPage&number=1
   ```

7. **Mendapatkan URL Audio**
   ```
   ?action=getAudio&surah=1&ayat=1&qari=default
   ```

### Contoh Respons

```json
{
  "status": "success",
  "data": {
    "surah": {
      "number": 1,
      "name": "Al-Fatihah",
      "name_latin": "Al-Fatihah",
      "number_of_ayah": 7,
      "revelation_type": "Makkiyah"
    },
    "ayat": [
      {
        "number": 1,
        "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "translation": "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."
      },
      // ... ayat lainnya
    ]
  }
}
```

## 🛠️ Cara Deploy

1. Buat Google Spreadsheet baru
2. Buat dua sheet: `surahQuran` dan `ayatQuran`
3. Impor data surah dan ayat sesuai struktur
4. Buka Google Apps Script dari menu Ekstensi
5. Salin kode dari `main.gs` ke editor script
6. Ganti `SPREADSHEET_ID` dengan ID Spreadsheet Anda
7. Deploy sebagai Web App
8. Tetapkan akses ke "Anyone, even anonymous"

## 📊 Struktur Data

### Sheet `surahQuran`
- number
- name
- name_latin
- number_of_ayah
- revelation_type
- ...

### Sheet `ayatQuran`
- surah
- number
- text
- latin
- translation
- juz
- page
- audio
- ...

## 🔒 Keamanan

API ini dilengkapi dengan sistem otentikasi sederhana untuk akses admin ke data analytics. Gunakan parameter `key` dengan nilai yang telah ditentukan untuk mengakses endpoint `getAnalytics`.

## 📝 Lisensi

Proyek ini tersedia di bawah lisensi MIT. Silakan lihat file LICENSE untuk detailnya.

## ✨ Kontribusi

Kontribusi selalu diterima! Silakan ajukan pull request atau buka issue untuk melaporkan bug atau meminta fitur baru.

## 📞 Kontak

Jika ada pertanyaan, silakan hubungi saya melalui [email] atau buka issue di repository ini.

---

_Dibuat dengan ❤️ untuk memudahkan akses terhadap Al-Quran_
