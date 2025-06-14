// Tracely Popup Script
// Menampilkan data tracking dalam UI yang menarik

class TracelyPopup {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.init();
  }

  async init() {
    this.updateCurrentDate();
    await this.loadTodayData();
    await this.loadHistoryData();
    this.setupEventListeners();
  }

  updateCurrentDate() {
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = 
      today.toLocaleDateString('en-US', options);
  }

  async loadTodayData() {
    try {
      const result = await chrome.storage.local.get([this.currentDate]);
      const todayData = result[this.currentDate];

      if (!todayData) {
        this.showEmptyState();
        return;
      }

      this.updateStatsOverview(todayData);
      this.updateTopSites(todayData);
      this.updateTimeSpent(todayData);
      this.updateHourlyChart(todayData);
    } catch (error) {
      console.error('Error loading today data:', error);
      this.showEmptyState();
    }
  }

  showEmptyState() {
    document.getElementById('totalSites').textContent = '0';
    document.getElementById('totalTime').textContent = '0h 0m';
    
    const emptyStateHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div>No browsing data yet today</div>
      </div>
    `;
    
    document.getElementById('topSites').innerHTML = emptyStateHTML;
    document.getElementById('timeSpent').innerHTML = emptyStateHTML;
    
    this.drawEmptyChart();
  }

  updateStatsOverview(data) {
    document.getElementById('totalSites').textContent = data.sitesVisited || 0;
    document.getElementById('totalTime').textContent = this.formatTime(data.totalActiveTime || 0);
  }

  updateTopSites(data) {
    const container = document.getElementById('topSites');
    const domains = Object.entries(data.domains || {});
    
    if (domains.length === 0) {
      container.innerHTML = '<div class="empty-state">No sites visited yet</div>';
      return;
    }

    // Sort by visits
    const topSites = domains
      .sort((a, b) => b[1].visits - a[1].visits)
      .slice(0, 5);

    const html = topSites.map(([domain, info]) => `
      <div class="site-item">
        <div class="site-info">
          <img class="site-favicon" src="https://www.google.com/s2/favicons?domain=${domain}" 
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDRMMTIgOEw4IDEyTDQgOEw4IDRaIiBmaWxsPSIjNjY3RUVBIi8+Cjwvc3ZnPgo='" alt="">
          <span class="site-name">${this.truncateDomain(domain)}</span>
        </div>
        <span class="site-visits">${info.visits} visits</span>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  updateTimeSpent(data) {
    const container = document.getElementById('timeSpent');
    const domains = Object.entries(data.domains || {});
    
    if (domains.length === 0) {
      container.innerHTML = '<div class="empty-state">No time tracked yet</div>';
      return;
    }

    // Sort by time spent
    const topDomains = domains
      .sort((a, b) => b[1].timeSpent - a[1].timeSpent)
      .slice(0, 5);

    const maxTime = Math.max(...topDomains.map(([, info]) => info.timeSpent));

    const html = topDomains.map(([domain, info]) => {
      const percentage = maxTime > 0 ? (info.timeSpent / maxTime) * 100 : 0;
      return `
        <div class="time-item">
          <span class="time-domain">${this.truncateDomain(domain)}</span>
          <span class="time-duration">${this.formatTime(info.timeSpent)}</span>
          <div class="time-bar">
            <div class="time-bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  updateHourlyChart(data) {
    const canvas = document.getElementById('hourlyChart');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 120;
    
    this.drawHourlyChart(ctx, data.hourlyActivity || new Array(24).fill(0));
  }

  drawHourlyChart(ctx, hourlyData) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Find max value
    const maxValue = Math.max(...hourlyData, 1);
    const barWidth = chartWidth / 24;
    
    // Draw bars
    hourlyData.forEach((value, hour) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + (hour * barWidth);
      const y = height - padding - barHeight;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      
      // Draw hour labels for selected hours
      if (hour % 4 === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hour.toString(), x + barWidth/2, height - 5);
      }
    });
    
    // Draw current hour indicator
    const currentHour = new Date().getHours();
    const currentX = padding + (currentHour * barWidth) + barWidth/2;
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, padding);
    ctx.lineTo(currentX, height - padding);
    ctx.stroke();
    
    // Add title
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Activity by Hour', padding, 15);
  }

  drawEmptyChart() {
    const canvas = document.getElementById('hourlyChart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 300;
    canvas.height = 120;
    
    this.drawHourlyChart(ctx, new Array(24).fill(0));
    
    // Add empty state text
    ctx.fillStyle = '#999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No activity data yet', canvas.width/2, canvas.height/2);
  }

  async loadHistoryData() {
    try {
      const result = await chrome.storage.local.get(null);
      const historyData = [];
      
      // Get last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        if (result[dateKey]) {
          historyData.push({
            date: dateKey,
            data: result[dateKey]
          });
        }
      }
      
      this.updateHistoryList(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  updateHistoryList(historyData) {
    const container = document.getElementById('historyList');
    
    if (historyData.length === 0) {
      container.innerHTML = '<div class="empty-state">No history available</div>';
      return;
    }

    const html = historyData.map(({ date, data }) => {
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      return `
        <div class="history-item">
          <span class="history-date">${formattedDate}</span>
          <div class="history-stats">
            <div>${data.sitesVisited || 0} sites</div>
            <div>${this.formatTime(data.totalActiveTime || 0)}</div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  setupEventListeners() {
    // Clear data button
    document.getElementById('clearData').addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear today\'s data? This action cannot be undone.')) {
        try {
          await chrome.storage.local.remove([this.currentDate]);
          location.reload();
        } catch (error) {
          console.error('Error clearing data:', error);
        }
      }
    });
  }

  formatTime(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0m';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  truncateDomain(domain) {
    if (domain.length > 20) {
      return domain.substring(0, 17) + '...';
    }
    return domain;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TracelyPopup();
});
