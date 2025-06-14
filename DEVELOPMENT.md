# Tracely Extension - Development Notes

## Tips Teknis yang Diminta

### 1. Cara Mencatat Kapan Tab Aktif Berganti

```javascript
// Di background.js
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Save data dari tab sebelumnya
  if (this.currentDomain && this.sessionStartTime) {
    await this.saveCurrentSession();
  }
  
  // Mulai tracking tab baru
  this.handleTabSwitch(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Tracking saat URL berubah dalam tab yang sama
  if (changeInfo.status === 'complete' && tab.active) {
    this.handleTabSwitch(tabId);
  }
});
```

### 2. Cara Mendeteksi Waktu Aktif Pengguna (Tidak Menghitung Idle)

```javascript
// Setup idle detection
chrome.idle.setDetectionInterval(60); // 60 detik

chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'idle' || state === 'locked') {
    this.handleUserInactive();
  } else {
    this.handleUserActive();
  }
});

// Di content script - deteksi aktivitas di halaman
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
activityEvents.forEach(event => {
  document.addEventListener(event, updateActivity, true);
});

// Window focus detection
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    this.handleUserInactive();
  } else {
    this.handleUserActive();
  }
});
```

### 3. Cara Reset Data Setiap Hari Jam 00:00

```javascript
setupDailyReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    this.cleanOldData(); // Hapus data lama (>7 hari)
    
    // Setup untuk hari berikutnya
    setInterval(() => {
      this.cleanOldData();
    }, 24 * 60 * 60 * 1000); // 24 jam
  }, msUntilMidnight);
}
```

## Cara Install dan Test

1. **Buka Chrome Extensions**
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**
   - Toggle di pojok kanan atas

3. **Load Unpacked Extension**
   - Klik "Load unpacked"
   - Pilih folder Tracely

4. **Test Extension**
   - Buka beberapa website
   - Tunggu beberapa menit
   - Klik icon Tracely di toolbar
   - Lihat data tracking

## Debugging

### Cek Background Script
```javascript
// Di Chrome DevTools > Extensions > Tracely > service worker
console.log('Background script loaded');
```

### Cek Storage Data
```javascript
// Di Console
chrome.storage.local.get(null, (data) => {
  console.log('All stored data:', data);
});
```

### Cek Specific Date
```javascript
const today = new Date().toISOString().split('T')[0];
chrome.storage.local.get([today], (result) => {
  console.log('Today data:', result);
});
```

## Manifest V3 Migration Notes

- Service Worker menggantikan background page
- chrome.action menggantikan chrome.browserAction
- Permissions lebih ketat
- Storage API tetap sama

## Common Issues & Solutions

### 1. Service Worker Sleep
- Service worker bisa "sleep" setelah tidak aktif
- Gunakan chrome.alarms untuk task periodic
- Simpan data secara berkala (setiap 10 detik)

### 2. Permission Issues
- Pastikan semua permission ada di manifest
- Test di incognito mode juga

### 3. Cross-Origin Issues
- Favicon loading mungkin gagal untuk beberapa domain
- Gunakan fallback icon

## Performance Tips

1. **Batasi Storage Size**
   - Hapus data lama (>7 hari)
   - Compress data jika perlu

2. **Efficient Tracking**
   - Jangan track terlalu sering
   - Batch save operations

3. **UI Performance**
   - Use canvas untuk chart
   - Lazy load historical data

## Security Considerations

- Tidak simpan data sensitive
- Validate domain names
- Sanitize data sebelum display
- Use HTTPS untuk favicon requests
