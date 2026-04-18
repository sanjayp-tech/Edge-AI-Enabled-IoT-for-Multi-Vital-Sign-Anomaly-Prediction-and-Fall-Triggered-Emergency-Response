/**
 * IoT Health Monitoring Dashboard - JavaScript
 * Real-time health monitoring with Chart.js and Leaflet.js
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_URL: '/api/data',
    REFRESH_INTERVAL: 1000, // 1 second
    MAX_DATA_POINTS: 20,
    ALERTS: {
        TEMP_HIGH: 40,
        HEART_HIGH: 130,
        FALL_THRESHOLD: 7
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    dataPoints: 0,
    alertCount: 0,
    startTime: Date.now(),
    activeAlerts: new Set(),
    previousData: null,
    charts: {},
    map: null,
    marker: null,
    chartData: {
        temperature: [],
        heartbeat: [],
        spo2: [],
        accelerometer: [],
        labels: []
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Patient Health Monitor loading...');
    
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Initialize components
    initCharts();
    initMap();
    
    // Start data fetching
    fetchData();
    setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
    
    // Start uptime counter
    setInterval(updateUptime, 1000);
    
    // Hide loading overlay after initialization
    setTimeout(() => {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
    }, 1500);
});

// ============================================
// CHART INITIALIZATION
// ============================================
function initCharts() {
    const chartConfig = {
        temperature: {
            ctx: document.getElementById('tempChart').getContext('2d'),
            color: '#ea580c',
            label: 'Temperature (°C)'
        },
        heartbeat: {
            ctx: document.getElementById('heartChart').getContext('2d'),
            color: '#dc2626',
            label: 'Heart Rate (BPM)'
        },
        spo2: {
            ctx: document.getElementById('spo2Chart').getContext('2d'),
            color: '#0ea5e9',
            label: 'SpO2 (%)'
        },
        accelerometer: {
            ctx: document.getElementById('accelChart').getContext('2d'),
            color: '#7c3aed',
            label: 'Motion (g)'
        }
    };

    Object.keys(chartConfig).forEach(key => {
        state.charts[key] = createChart(
            chartConfig[key].ctx,
            chartConfig[key].color,
            chartConfig[key].label
        );
    });
}

function createChart(ctx, color, label) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: hexToRgba(color, 0.1),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: color,
                    borderColor: color,
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    titleFont: {
                        family: 'Inter',
                        size: 11
                    },
                    bodyFont: {
                        family: 'Inter',
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(100, 100, 100, 0.5)',
                        font: {
                            family: 'Inter',
                            size: 10
                        },
                        padding: 8
                    }
                }
            }
        }
    });
}

// ============================================
// MAP INITIALIZATION
// ============================================
function initMap() {
    // Default location
    const defaultLat = 11.678102;
    const defaultLng = 78.124435;

    // Initialize map
    state.map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([defaultLat, defaultLng], 15);

    // Add tile layer (dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(state.map);

    // Custom marker icon
    const customIcon = L.divIcon({
        className: 'custom-marker-wrapper',
        html: `
            <div style="
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #00f0ff, #b366ff);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 20px #00f0ff, 0 0 40px rgba(0, 240, 255, 0.3);
                animation: marker-pulse 2s ease-in-out infinite;
            "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });

    // Add marker
    state.marker = L.marker([defaultLat, defaultLng], { icon: customIcon })
        .addTo(state.map)
        .bindPopup(createPopupContent(defaultLat, defaultLng));
}

function createPopupContent(lat, lng) {
    return `
        <div style="text-align: center; min-width: 180px;">
            <div style="font-size: 14px; font-weight: 600; color: #00f0ff; margin-bottom: 8px;">
                Patient location
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">
                <span style="color: #6b7280;">Lat:</span> 
                <span style="color: #fff; font-family: monospace;">${lat.toFixed(6)}</span>
            </div>
            <div style="font-size: 12px; color: #9ca3af;">
                <span style="color: #6b7280;">Lng:</span> 
                <span style="color: #fff; font-family: monospace;">${lng.toFixed(6)}</span>
            </div>
        </div>
    `;
}

function centerMap() {
    if (state.marker && state.map) {
        const pos = state.marker.getLatLng();
        state.map.setView(pos, 15, { animate: true });
    }
}

// Make centerMap globally accessible
window.centerMap = centerMap;

// ============================================
// DATA FETCHING
// ============================================
async function fetchData() {
    try {
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();
        
        if (data) {
            state.dataPoints++;
            updateDashboard(data);
            updateConnectionStatus(true);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        updateConnectionStatus(false);
    }
}

// ============================================
// DASHBOARD UPDATE
// ============================================
function updateDashboard(data) {
    // Update timestamp
    updateTimestamp();
    
    // Update sensor cards
    updateSensorCards(data);
    
    // Update charts
    updateCharts(data);
    
    // Update map
    updateMap(data.latitude, data.longitude);
    
    // Check alerts
    checkAlerts(data);
    
    // Update stats
    document.getElementById('dataPoints').textContent = state.dataPoints;
    
    // Store previous data
    state.previousData = data;
}

function updateSensorCards(data) {
    // Temperature
    updateCard('temp', data.temperature, '°C', data.temperature > CONFIG.ALERTS.TEMP_HIGH);
    
    // Heart Rate
    updateCard('heart', data.heartbeat, 'BPM', data.heartbeat > CONFIG.ALERTS.HEART_HIGH);
    
    // SpO2
    updateCard('spo2', data.spo2, '%', false);
    
    // Accelerometer
    updateCard('accel', data.accelerometer.toFixed(2), 'g', data.accelerometer > CONFIG.ALERTS.FALL_THRESHOLD);
    
    // Status
    const statusEl = document.getElementById('statusValue');
    statusEl.textContent = data.status;
    statusEl.className = `text-xl font-inter font-semibold mb-1 ${
        data.status === 'NORMAL' ? 'text-green-600' : 
        data.status === 'OFFLINE' ? 'text-gray-500' : 'text-red-600'
    }`;
    
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.className = `status-indicator ${
        data.status === 'NORMAL' ? 'bg-green-500' : 
        data.status === 'OFFLINE' ? 'bg-gray-400' : 'bg-red-600'
    }`;
}

function updateCard(prefix, value, unit, isAlert) {
    const valueEl = document.getElementById(`${prefix}Value`);
    const indicatorEl = document.getElementById(`${prefix}Indicator`);
    const cardEl = document.getElementById(`${prefix}Card`);
    
    // Update value with animation
    const oldValue = valueEl.textContent;
    if (oldValue !== String(value)) {
        valueEl.textContent = value;
        valueEl.classList.add('value-change');
        setTimeout(() => valueEl.classList.remove('value-change'), 300);
    }
    
    // Update indicator and card state
    if (isAlert) {
        indicatorEl.className = 'status-indicator bg-red-500';
        cardEl.classList.add('alert-active');
    } else {
        indicatorEl.className = 'status-indicator bg-green-500';
        cardEl.classList.remove('alert-active');
    }
    
    // Update live values in charts section
    const liveEl = document.getElementById(`${prefix}Live`);
    if (liveEl) {
        liveEl.textContent = `${value} ${unit}`;
    }
}

function updateCharts(data) {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    // Add new data points
    addDataPoint('temperature', data.temperature, timestamp);
    addDataPoint('heartbeat', data.heartbeat, timestamp);
    addDataPoint('spo2', data.spo2, timestamp);
    addDataPoint('accelerometer', data.accelerometer, timestamp);
    
    // Update all charts
    Object.values(state.charts).forEach(chart => chart.update('none'));
}

function addDataPoint(key, value, label) {
    const chart = state.charts[key];
    
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);
    
    // Keep only last N points
    if (chart.data.labels.length > CONFIG.MAX_DATA_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
}

function updateMap(lat, lng) {
    if (state.marker && lat && lng) {
        const newPos = L.latLng(lat, lng);
        const currentPos = state.marker.getLatLng();
        
        // Only update if position changed
        if (currentPos.lat !== lat || currentPos.lng !== lng) {
            state.marker.setLatLng(newPos);
            state.marker.setPopupContent(createPopupContent(lat, lng));
        }
        
        // Update coordinate display
        document.getElementById('latValue').textContent = lat.toFixed(6);
        document.getElementById('lngValue').textContent = lng.toFixed(6);
    }
}

// ============================================
// ALERT SYSTEM
// ============================================
function checkAlerts(data) {
    const alerts = [];
    
    // Temperature Alert
    if (data.temperature > CONFIG.ALERTS.TEMP_HIGH) {
        alerts.push({
            id: 'temp',
            type: 'temperature',
            title: 'High temperature',
            description: `Temperature is ${data.temperature}°C (above ${CONFIG.ALERTS.TEMP_HIGH}°C).`,
            icon: 'thermometer',
            color: 'red'
        });
    }
    
    // Heart Rate Alert
    if (data.heartbeat > CONFIG.ALERTS.HEART_HIGH) {
        alerts.push({
            id: 'heart',
            type: 'heartrate',
            title: 'High heart rate',
            description: `Heart rate is ${data.heartbeat} BPM (above ${CONFIG.ALERTS.HEART_HIGH} BPM).`,
            icon: 'heart-pulse',
            color: 'red'
        });
    }
    
    // Fall Detection Alert
    if (data.accelerometer > CONFIG.ALERTS.FALL_THRESHOLD) {
        alerts.push({
            id: 'fall',
            type: 'fall',
            title: 'Possible fall detected',
            description: `Motion reading is ${data.accelerometer.toFixed(2)}g (threshold ${CONFIG.ALERTS.FALL_THRESHOLD}g).`,
            icon: 'alert-triangle',
            color: 'orange'
        });
    }
    
    // Process alerts
    processAlerts(alerts);
}

function processAlerts(alerts) {
    const alertPanel = document.getElementById('alertPanel');
    const newAlertIds = new Set(alerts.map(a => a.id));
    
    // Check for new alerts and show popups
    alerts.forEach(alert => {
        if (!state.activeAlerts.has(alert.id)) {
            state.alertCount++;
            document.getElementById('alertCount').textContent = state.alertCount;
            showPopupAlert(alert);
        }
    });
    
    // Update active alerts
    state.activeAlerts = newAlertIds;
    
    // Update alert panel
    if (alerts.length > 0) {
        alertPanel.innerHTML = alerts.map(alert => createAlertCard(alert)).join('');
    } else {
        alertPanel.innerHTML = `
            <div class="glass-card rounded-xl p-4 border border-white/5">
                <div class="flex items-center justify-center py-8 text-gray-500">
                    <div class="text-center">
                        <i data-lucide="check-circle" class="w-12 h-12 mx-auto mb-3 text-green-500/50"></i>
                        <p class="text-sm">No active alerts</p>
                        <p class="text-xs text-gray-600 mt-1">Everything looks stable</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Reinitialize icons
    lucide.createIcons();
}

function createAlertCard(alert) {
    const time = new Date().toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const colorClasses = alert.color === 'red' 
        ? 'border-red-500 bg-red-500/10' 
        : 'border-orange-500 bg-orange-500/10';
    
    const iconColor = alert.color === 'red' ? 'text-red-400' : 'text-orange-400';
    
    return `
        <div class="alert-card ${alert.type} glass-card rounded-xl p-4 ${colorClasses} animate-pulse">
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-${alert.color}-500/20 flex items-center justify-center">
                    <i data-lucide="${alert.icon}" class="w-5 h-5 ${iconColor} alert-icon"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold ${iconColor}">${alert.title}</p>
                    <p class="text-xs text-gray-400 mt-1">${alert.description}</p>
                    <p class="text-xs text-gray-500 mt-2 flex items-center">
                        <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                        ${time}
                    </p>
                </div>
            </div>
        </div>
    `;
}

function showPopupAlert(alert) {
    const popup = document.getElementById('alertPopup');
    const alertEl = document.createElement('div');
    
    const bgColor = alert.color === 'red' ? 'from-red-50 to-red-100' : 'from-orange-50 to-orange-100';
    const borderColor = alert.color === 'red' ? 'border-red-300' : 'border-orange-300';
    const iconColor = alert.color === 'red' ? 'text-red-600' : 'text-orange-600';
    
    alertEl.className = `popup-alert glass-card rounded-xl p-4 bg-gradient-to-r ${bgColor} border ${borderColor} shadow-md`;
    alertEl.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-${alert.color}-100 flex items-center justify-center">
                <i data-lucide="${alert.icon}" class="w-5 h-5 ${iconColor}"></i>
            </div>
            <div>
                <p class="text-sm font-bold ${iconColor}">${alert.title}</p>
                <p class="text-xs text-gray-700">${alert.description}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-400 hover:text-gray-600">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    popup.appendChild(alertEl);
    lucide.createIcons();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertEl.classList.add('removing');
        setTimeout(() => alertEl.remove(), 300);
    }, 5000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function updateTimestamp() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateUptime() {
    const elapsed = Date.now() - state.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    document.getElementById('uptimeValue').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateConnectionStatus(isOnline) {
    const statusEl = document.getElementById('connectionStatus');
    const textEl = document.getElementById('connectionText');
    
    if (isOnline) {
        statusEl.className = 'flex items-center space-x-2 px-4 py-2 rounded-full bg-green-100 border border-green-300';
        statusEl.innerHTML = `
            <div class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span class="text-green-700 text-sm font-medium">Connected</span>
        `;
        textEl.textContent = 'Active';
        textEl.className = 'text-green-600';
    } else {
        statusEl.className = 'flex items-center space-x-2 px-4 py-2 rounded-full bg-red-100 border border-red-300';
        statusEl.innerHTML = `
            <div class="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span class="text-red-700 text-sm font-medium">Disconnected</span>
        `;
        textEl.textContent = 'Disconnected';
        textEl.className = 'text-red-600';
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================
// CONSOLE BRANDING
// ============================================
console.log('Patient Health Monitor initialized.');
console.log('Fetching data every 1 second.');
