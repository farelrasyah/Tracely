# 🕒 Tracely - Chrome Extension

**Tracely** adalah ekstensi Chrome yang melacak aktivitas browsing harian Anda dan menampilkan ringkasan informatif dalam tampilan popup yang modern dan elegan.

## ✨ Fitur Utama

- 📊 **Pelacakan Waktu per Domain** - Melacak total waktu yang dihabiskan di setiap situs web
- 🏆 **Top 5 Situs Terpopuler** - Menampilkan situs yang paling sering dikunjungi hari ini
- 📈 **Grafik Aktivitas per Jam** - Visualisasi aktivitas browsing berdasarkan waktu
- 📅 **Histori 7 Hari** - Menyimpan dan menampilkan ringkasan aktivitas 7 hari terakhir
- 🎯 **UI Modern & Elegan** - Interface yang menarik dan mudah digunakan
- 💾 **Penyimpanan Lokal** - Data disimpan secara lokal menggunakan `chrome.storage.local`
- 🔄 **Reset Harian Otomatis** - Data direset otomatis setiap hari jam 00:00

## 🚀 Instalasi

### Method 1: Manual Installation (Developer Mode)

1. **Clone atau Download** repository ini
   ```bash
   git clone https://github.com/username/tracely-extension.git
   ```

2. **Buka Chrome Extensions**
   - Buka Chrome browser
   - Ketik `chrome://extensions/` di address bar
   - Atau buka menu Chrome → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" di pojok kanan atas

4. **Load Extension**
   - Klik "Load unpacked"
   - Pilih folder `Tracely` yang berisi semua file ekstensi
   - Ekstensi akan muncul di daftar extensions

5. **Pin Extension** (Opsional)
   - Klik icon puzzle di toolbar Chrome
   - Pin ekstensi Tracely agar mudah diakses

## 📋 Struktur File

```
Tracely/
├── manifest.json          # Konfigurasi ekstensi (Manifest V3)
├── background.js           # Service worker untuk tracking
├── content.js             # Script untuk deteksi aktivitas user
├── popup.html             # UI popup extension
├── popup.css              # Styling modern untuk popup
├── popup.js               # Logic untuk menampilkan data
├── icons/                 # Folder untuk icon ekstensi
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Dokumentasi ini
```

## 🛠️ Komponen Teknis

### 1. Background Script (`background.js`)
- **Service Worker** untuk Manifest V3
- Melacak perubahan tab aktif menggunakan `chrome.tabs.onActivated`
- Deteksi idle state menggunakan `chrome.idle.onStateChanged`
- Menyimpan data setiap 10 detik untuk menghindari kehilangan data
- Auto-reset data setiap hari jam 00:00

### 2. Content Script (`content.js`)
- Mendeteksi aktivitas user di halaman (mouse, keyboard, scroll)
- Mengirim status aktivitas ke background script
- Memantau visibility halaman (tab aktif/tidak aktif)

### 3. Popup Interface (`popup.html`, `popup.css`, `popup.js`)
- UI modern dengan gradient dan animasi
- Canvas chart untuk visualisasi aktivitas per jam
- Responsive design
- Real-time data display

## 🔧 Cara Kerja Tracking

### Deteksi Tab Aktif
```javascript
chrome.tabs.onActivated.addListener((activeInfo) => {
  this.handleTabSwitch(activeInfo.tabId);
});
```

### Deteksi Waktu Aktif User
- Menggunakan `chrome.idle.setDetectionInterval(60)` untuk deteksi idle (60 detik)
- Content script mendeteksi aktivitas mouse, keyboard, dan scroll
- Tracking dihentikan saat user idle atau tab tidak aktif

### Reset Data Harian
```javascript
setupDailyReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  // Setup reset pada jam 00:00
}
```

## 📊 Format Data Storage

Data disimpan dalam `chrome.storage.local` dengan format:

```javascript
{
  "2025-06-15": {
    "date": "2025-06-15",
    "domains": {
      "youtube.com": {
        "timeSpent": 1800000,  // dalam milliseconds
        "visits": 5,
        "lastVisit": 1718467200000
      },
      "github.com": {
        "timeSpent": 3600000,
        "visits": 12,
        "lastVisit": 1718470800000
      }
    },
    "hourlyActivity": [0, 0, 0, 150000, 300000, ...], // 24 elements
    "totalActiveTime": 5400000,
    "sitesVisited": 15
  }
}
```

## 🎨 Features dalam Popup

1. **Stats Overview**
   - Total situs dikunjungi hari ini
   - Total waktu aktif browsing

2. **Most Visited Sites**
   - Top 5 situs berdasarkan jumlah kunjungan
   - Favicon dan counter visits

3. **Time Spent**
   - Top 5 situs berdasarkan waktu yang dihabiskan
   - Progress bar relatif

4. **Hourly Activity Chart**
   - Grafik batang aktivitas per jam (0-23)
   - Indikator jam saat ini

5. **7-Day History**
   - Ringkasan aktivitas 7 hari terakhir
   - Jumlah situs dan total waktu per hari

## ⚙️ Permissions yang Digunakan

- `tabs` - Untuk mengakses informasi tab
- `activeTab` - Untuk mengetahui tab yang aktif
- `storage` - Untuk menyimpan data tracking
- `idle` - Untuk deteksi status idle user

## 🐛 Troubleshooting

### Extension tidak muncul
- Pastikan Developer Mode diaktifkan
- Cek apakah ada error di console `chrome://extensions/`

### Data tidak tersimpan
- Buka Developer Tools → Application → Storage → Extension
- Cek apakah `chrome.storage.local` terisi

### Tracking tidak akurat
- Pastikan extension memiliki permission yang diperlukan
- Cek Network tab untuk error pada favicon

## 🔒 Privacy & Security

- **Semua data disimpan lokal** di browser Anda
- **Tidak ada pengiriman data** ke server eksternal
- **Tidak ada tracking** aktivitas di luar browser
- Data otomatis dihapus setelah 7 hari

## 🤝 Contributing

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👨‍💻 Author

**Farel Rasyah**
- GitHub: [@username](https://github.com/farelrasyah)
- Email: farelrasyah87@gmail.com

## 🎯 Roadmap

- [ ] Export data ke CSV/JSON
- [ ] Dark mode theme
- [ ] Website blocking functionality
- [ ] Productivity insights
- [ ] Custom categories untuk websites
- [ ] Weekly/Monthly reports

---

**Made with ❤️ for better browsing awareness**
