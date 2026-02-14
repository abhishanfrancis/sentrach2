// ============ Configuration ============
const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws/feed';

// ============ State ============
let ws = null;
let chart = null;
let sentimentHistory = [];
const MAX_HISTORY = 30;

// ============ DOM Elements ============
const elements = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    vibeScore: document.getElementById('vibeScore'),
    vibeLabel: document.getElementById('vibeLabel'),
    meterIndicator: document.getElementById('meterIndicator'),
    postCount: document.getElementById('postCount'),
    confidence: document.getElementById('confidence'),
    volumeIndex: document.getElementById('volumeIndex'),
    trendDirection: document.getElementById('trendDirection'),
    chainScore: document.getElementById('chainScore'),
    lastTx: document.getElementById('lastTx'),
    pushBtn: document.getElementById('pushBtn'),
    txStatus: document.getElementById('txStatus'),
    feedContainer: document.getElementById('feedContainer')
};

// ============ WebSocket ============
function connectWebSocket() {
    updateStatus('connecting');
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('Connected to sentiment stream');
        updateStatus('connected');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleUpdate(data);
    };
    
    ws.onclose = () => {
        console.log('Disconnected');
        updateStatus('disconnected');
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        updateStatus('disconnected');
    };
}

function updateStatus(status) {
    elements.statusDot.className = 'status-dot ' + status;
    const texts = {
        connecting: 'Connecting...',
        connected: 'Live',
        disconnected: 'Offline'
    };
    elements.statusText.textContent = texts[status] || status;
}

// ============ Handle Updates ============
function handleUpdate(data) {
    if (data.type === 'init') {
        updateVibeDisplay(data.vibe_score);
        elements.feedContainer.innerHTML = '';
        data.recent_posts.reverse().forEach(addPostToFeed);
    } else if (data.vibe_score) {
        updateVibeDisplay(data.vibe_score);
        if (data.post) addPostToFeed(data.post);
    }
}

function updateVibeDisplay(vibe) {
    const score = vibe.score;
    const formatted = score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
    
    // Update score
    elements.vibeScore.textContent = formatted;
    elements.vibeScore.className = 'score ' + getScoreClass(score);
    
    // Update label
    elements.vibeLabel.textContent = vibe.label;
    
    // Update meter position (score -1 to +1 → 0% to 100%)
    const percent = ((score + 1) / 2) * 100;
    elements.meterIndicator.style.left = `${percent}%`;
    
    // Update new metrics
    if (elements.confidence) {
        elements.confidence.textContent = `${(vibe.confidence || 0).toFixed(0)}%`;
    }
    if (elements.volumeIndex) {
        elements.volumeIndex.textContent = `${(vibe.volume_index || 1).toFixed(1)}x`;
    }
    if (elements.trendDirection) {
        const trendIcons = { 'UP': '↑ UP', 'DOWN': '↓ DOWN', 'STABLE': '→ STABLE' };
        elements.trendDirection.textContent = trendIcons[vibe.trend_direction] || '--';
        elements.trendDirection.className = 'stat-value trend-' + (vibe.trend_direction || 'stable').toLowerCase();
    }
    
    // Update stats
    elements.postCount.textContent = vibe.post_count;
    
    // Update chart
    addToChart(score);
}

function getScoreClass(score) {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
}

function addPostToFeed(post) {
    const placeholder = elements.feedContainer.querySelector('.feed-placeholder');
    if (placeholder) placeholder.remove();
    
    const scoreClass = getScoreClass(post.sentiment_score);
    const scoreText = post.sentiment_score >= 0 
        ? `+${post.sentiment_score.toFixed(2)}` 
        : post.sentiment_score.toFixed(2);
    
    const item = document.createElement('div');
    item.className = `feed-item ${scoreClass}`;
    item.innerHTML = `
        <div class="feed-header">
            <span class="feed-user">@${post.username}</span>
            <span class="feed-score ${scoreClass}">${scoreText}</span>
        </div>
        <div class="feed-content">${escapeHtml(post.content)}</div>
        <div class="feed-time">${formatTime(post.timestamp)}</div>
    `;
    
    elements.feedContainer.insertBefore(item, elements.feedContainer.firstChild);
    
    // Keep max 50 items
    while (elements.feedContainer.children.length > 50) {
        elements.feedContainer.removeChild(elements.feedContainer.lastChild);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString();
}

// ============ Chart ============
function initChart() {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#00f5ff',
                backgroundColor: 'rgba(0, 245, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: {
                    min: -1,
                    max: 1,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#888' }
                }
            },
            animation: { duration: 200 }
        }
    });
}

function addToChart(score) {
    sentimentHistory.push(score);
    if (sentimentHistory.length > MAX_HISTORY) sentimentHistory.shift();
    
    chart.data.labels = sentimentHistory.map((_, i) => i);
    chart.data.datasets[0].data = sentimentHistory;
    
    // Color based on current score
    const color = score > 0.1 ? '#00ff88' : score < -0.1 ? '#ff3366' : '#ffcc00';
    chart.data.datasets[0].borderColor = color;
    
    chart.update('none');
}

// ============ Blockchain ============
async function pushToChain() {
    elements.pushBtn.disabled = true;
    elements.txStatus.textContent = 'Pushing to chain...';
    elements.txStatus.className = 'tx-status pending';
    
    try {
        const res = await fetch(`${API_URL}/push`, { method: 'POST' });
        const data = await res.json();
        
        elements.chainScore.textContent = data.score_pushed;
        elements.lastTx.textContent = data.tx_hash.slice(0, 16) + '...';
        elements.txStatus.textContent = `✓ ${data.status === 'simulated' ? 'Simulated' : 'Confirmed'}`;
        elements.txStatus.className = 'tx-status success';
    } catch (err) {
        elements.txStatus.textContent = `✗ Failed: ${err.message}`;
        elements.txStatus.className = 'tx-status error';
    } finally {
        elements.pushBtn.disabled = false;
    }
}

async function fetchVibe() {
    try {
        const res = await fetch(`${API_URL}/vibe`);
        const vibe = await res.json();
        updateVibeDisplay(vibe);
    } catch (err) {
        console.log('Could not fetch vibe');
    }
}

// ============ Initialize ============
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    connectWebSocket();
    fetchVibe();
});

window.pushToChain = pushToChain;
