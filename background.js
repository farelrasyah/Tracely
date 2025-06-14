// Tracely Background Script - Service Worker
// Melacak aktivitas browsing pengguna dan menyimpan data

class TracelyTracker {
  constructor() {
    this.currentTabId = null;
    this.currentDomain = null;
    this.sessionStartTime = null;
    this.isUserActive = true;
    this.trackingInterval = null;
    
    this.init();
  }

  init() {
    // Setup event listeners
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabSwitch(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabSwitch(tabId);
      }
    });

    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        this.handleUserInactive();
      } else {
        this.handleUserActive();
      }
    });

    // Deteksi idle state
    chrome.idle.onStateChanged.addListener((state) => {
      if (state === 'idle' || state === 'locked') {
        this.handleUserInactive();
      } else {
        this.handleUserActive();
      }
    });

    // Start tracking
    this.startTracking();
    
    // Setup daily reset
    this.setupDailyReset();
    
    // Initialize current tab
    this.getCurrentTab();
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.handleTabSwitch(tab.id);
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  async handleTabSwitch(tabId) {
    try {
      // Save current session before switching
      if (this.currentDomain && this.sessionStartTime) {
        await this.saveCurrentSession();
      }

      // Get new tab info
      const tab = await chrome.tabs.get(tabId);
      const domain = this.extractDomain(tab.url);
      
      if (domain && domain !== 'chrome-extension' && domain !== 'chrome') {
        this.currentTabId = tabId;
        this.currentDomain = domain;
        this.sessionStartTime = Date.now();
        this.isUserActive = true;
      }
    } catch (error) {
      console.error('Error handling tab switch:', error);
    }
  }

  extractDomain(url) {
    try {
      if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        return null;
      }
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return null;
    }
  }

  async saveCurrentSession() {
    if (!this.currentDomain || !this.sessionStartTime || !this.isUserActive) {
      return;
    }

    const sessionDuration = Date.now() - this.sessionStartTime;
    const today = this.getToday();
    
    try {
      const result = await chrome.storage.local.get([today]);
      const todayData = result[today] || this.getEmptyDayData();
      
      // Update domain time
      if (!todayData.domains[this.currentDomain]) {
        todayData.domains[this.currentDomain] = {
          timeSpent: 0,
          visits: 0,
          lastVisit: Date.now()
        };
      }
      
      todayData.domains[this.currentDomain].timeSpent += sessionDuration;
      todayData.domains[this.currentDomain].visits += 1;
      todayData.domains[this.currentDomain].lastVisit = Date.now();
      
      // Update hourly activity
      const hour = new Date().getHours();
      todayData.hourlyActivity[hour] += sessionDuration;
      
      // Update total time
      todayData.totalActiveTime += sessionDuration;
      
      // Update sites visited count
      todayData.sitesVisited = Object.keys(todayData.domains).length;
      
      await chrome.storage.local.set({ [today]: todayData });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  handleUserActive() {
    if (!this.isUserActive) {
      this.isUserActive = true;
      this.sessionStartTime = Date.now();
    }
  }

  handleUserInactive() {
    if (this.isUserActive) {
      this.saveCurrentSession();
      this.isUserActive = false;
    }
  }

  startTracking() {
    // Save session setiap 10 detik untuk menghindari kehilangan data
    this.trackingInterval = setInterval(() => {
      if (this.isUserActive && this.currentDomain) {
        this.saveCurrentSession();
        this.sessionStartTime = Date.now(); // Reset start time
      }
    }, 10000);
  }

  getToday() {
    return new Date().toISOString().split('T')[0];
  }

  getEmptyDayData() {
    return {
      date: this.getToday(),
      domains: {},
      hourlyActivity: new Array(24).fill(0),
      totalActiveTime: 0,
      sitesVisited: 0
    };
  }

  setupDailyReset() {
    // Reset data setiap hari jam 00:00
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.cleanOldData();
      // Setup untuk hari berikutnya
      setInterval(() => {
        this.cleanOldData();
      }, 24 * 60 * 60 * 1000); // 24 jam
    }, msUntilMidnight);
  }

  async cleanOldData() {
    try {
      const result = await chrome.storage.local.get(null);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const keysToRemove = [];
      
      for (const key in result) {
        const keyDate = new Date(key);
        if (keyDate < sevenDaysAgo) {
          keysToRemove.push(key);
        }
      }
      
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch (error) {
      console.error('Error cleaning old data:', error);
    }
  }
}

// Initialize tracker
const tracker = new TracelyTracker();

// Set idle detection threshold (60 seconds)
chrome.idle.setDetectionInterval(60);
