// Content script untuk mendeteksi aktivitas user di halaman
let lastActivity = Date.now();
let isPageVisible = !document.hidden;

// Deteksi aktivitas user
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

function updateActivity() {
  lastActivity = Date.now();
  // Send activity status to background
  chrome.runtime.sendMessage({
    type: 'user_activity',
    timestamp: lastActivity,
    visible: isPageVisible
  });
}

// Add event listeners
activityEvents.forEach(event => {
  document.addEventListener(event, updateActivity, true);
});

// Page visibility change
document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
  if (isPageVisible) {
    updateActivity();
  } else {
    chrome.runtime.sendMessage({
      type: 'page_hidden',
      timestamp: Date.now()
    });
  }
});

// Initial activity
updateActivity();
