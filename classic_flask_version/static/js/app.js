/* =========================================================
   SEGMENT AI — INTERACTIVE FRONTEND APPLICATION JS
   ========================================================= */

// Global App State
let appState = {
    isLoggedIn: false,
    user: { name: 'Guest User', email: 'guest@segmentai.io', role: 'Evaluator' },
    currentTab: 'home',
    clusterData: null
};

// Colors palette for Plotly charts
const CLUSTER_COLORS = ['#38bdf8', '#c084fc', '#34d399', '#fb923c', '#f472b6', '#2dd4bf', '#facc15'];

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    fetchStats();
    fetchCustomerData();
    fetchEDA();
    triggerClustering();
}

// ---------------------------------------------------------
// Navigation & Tab Switching
// ---------------------------------------------------------
function switchTab(tabId) {
    appState.currentTab = tabId;

    // Update section active classes
    document.querySelectorAll('.tab-section').forEach(sec => {
        sec.classList.remove('active');
    });
    const targetSec = document.getElementById(`sec-${tabId}`);
    if (targetSec) targetSec.classList.add('active');

    // Update nav links active class
    document.querySelectorAll('.nav-item').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${tabId}`) {
            link.classList.add('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobileDrawer');
    drawer.classList.toggle('open');
}

function mobileSwitchTab(tabId) {
    switchTab(tabId);
    toggleMobileMenu();
}

function toggleUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    menu.classList.toggle('show');
}

// Close dropdown if clicked outside
window.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown-container')) {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.classList.remove('show');
    }
});

// ---------------------------------------------------------
// Authentication (Login / Logout)
// ---------------------------------------------------------
function openLoginModal() {
    document.getElementById('loginModal').classList.add('show');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}

function submitLoginForm() {
    const userVal = document.getElementById('loginUser').value.trim();
    if (userVal) {
        setLoggedInUser(userVal || "Alex Morgan", "alex@segmentai.io", "Lead ML Engineer");
    }
}

function quickDemoLogin() {
    setLoggedInUser("Guest Evaluator", "guest@segmentai.io", "Project Reviewer");
}

function setLoggedInUser(name, email, role) {
    appState.isLoggedIn = true;
    appState.user = { name, email, role };

    document.getElementById('navUserName').innerText = name.split(' ')[0];
    document.getElementById('userDropdownHeader').innerHTML = `
        <p class="user-dp-name">${name}</p>
        <p class="user-dp-email">${email}</p>
    `;
    document.getElementById('mUserName').innerText = name;

    closeLoginModal();
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('show');

    showNotification(`Welcome back, ${name}!`);
}

function handleLogout() {
    appState.isLoggedIn = false;
    appState.user = { name: 'Guest User', email: 'guest@segmentai.io', role: 'Evaluator' };

    document.getElementById('navUserName').innerText = 'Sign In';
    document.getElementById('userDropdownHeader').innerHTML = `
        <p class="user-dp-name">Guest User</p>
        <p class="user-dp-email">guest@segmentai.io</p>
    `;
    document.getElementById('mUserName').innerText = 'Guest Evaluator';

    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('show');

    showNotification('Logged out successfully.');
}

function showNotification(msg) {
    alert(msg);
}

// ---------------------------------------------------------
// API Data Fetching & Rendering
// ---------------------------------------------------------
function fetchStats() {
    fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
            document.getElementById('kpiTotalCust').innerText = data.total_customers;
            document.getElementById('kpiAvgInc').innerText = `$${data.avg_income}k`;
            document.getElementById('kpiAvgSpend').innerText = `${data.avg_spending}/100`;
            document.getElementById('kpiAvgFreq').innerText = `${data.avg_frequency}/yr`;
        })
        .catch(err => console.error("Error fetching stats:", err));
}

function fetchCustomerData() {
    fetch('/api/data')
        .then(res => res.json())
        .then(data => {
            const tableHead = document.getElementById('tableHeaderRow');
            const tableBody = document.getElementById('tableBodyRow');

            document.getElementById('dataRecordCount').innerText = `Showing ${data.records.length} / ${data.total_rows} Records`;

            // Build headers
            tableHead.innerHTML = data.columns.map(col => `<th>${col}</th>`).join('');

            // Build rows
            tableBody.innerHTML = data.records.map(row => {
                return `<tr>${data.columns.map(col => `<td>${row[col]}</td>`).join('')}</tr>`;
            }).join('');
        });
}

function fetchEDA() {
    fetch('/api/eda')
        .then(res => res.json())
        .then(data => {
            renderIncomeVsSpendingChart(data);
            renderAgeVsSpendingChart(data);
            renderGenderChart(data);
            renderHeatmapChart(data);
        });
}

function renderIncomeVsSpendingChart(data) {
    const trace = {
        x: data.income,
        y: data.spending,
        mode: 'markers',
        type: 'scatter',
        marker: { size: 9, color: '#38bdf8', opacity: 0.8 }
    };
    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 40, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Annual Income (k$)', gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { title: 'Spending Score (1-100)', gridcolor: 'rgba(255,255,255,0.05)' }
    };
    Plotly.newPlot('chartIncomeSpend', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderAgeVsSpendingChart(data) {
    const trace = {
        x: data.age,
        y: data.spending,
        mode: 'markers',
        type: 'scatter',
        marker: { size: 9, color: '#c084fc', opacity: 0.8 }
    };
    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 40, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Age (Years)', gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { title: 'Spending Score (1-100)', gridcolor: 'rgba(255,255,255,0.05)' }
    };
    Plotly.newPlot('chartAgeSpend', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderGenderChart(data) {
    const trace = {
        labels: Object.keys(data.gender),
        values: Object.values(data.gender),
        type: 'pie',
        hole: 0.4,
        marker: { colors: ['#38bdf8', '#f472b6'] }
    };
    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 20, r: 20, t: 20, b: 20 }
    };
    Plotly.newPlot('chartGenderPie', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderHeatmapChart(data) {
    const cols = Object.keys(data.correlation);
    const zValues = cols.map(c1 => cols.map(c2 => data.correlation[c1][c2]));

    const trace = {
        z: zValues,
        x: cols,
        y: cols,
        type: 'heatmap',
        colorscale: 'RdBu_r'
    };
    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 80, r: 20, t: 20, b: 80 }
    };
    Plotly.newPlot('chartHeatmap', [trace], layout, { responsive: true, displayModeBar: false });
}

// ---------------------------------------------------------
// ML Clustering Execution & 3D/2D Visualizations
// ---------------------------------------------------------
function triggerClustering() {
    const algo = document.getElementById('algoSelect').value;
    const kVal = document.getElementById('kSlider').value;
    const epsVal = document.getElementById('epsSlider').value;
    const minSampVal = document.getElementById('minSampSlider').value;

    // Toggle controls visibility
    if (algo === 'DBSCAN') {
        document.getElementById('groupClusters').classList.add('hidden');
        document.getElementById('groupDBSCAN').classList.remove('hidden');
    } else {
        document.getElementById('groupClusters').classList.remove('hidden');
        document.getElementById('groupDBSCAN').classList.add('hidden');
    }

    fetch('/api/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            algorithm: algo,
            n_clusters: kVal,
            eps: epsVal,
            min_samples: minSampVal
        })
    })
    .then(res => res.json())
    .then(data => {
        appState.clusterData = data;

        document.getElementById('kpiOptClusters').innerText = `K = ${data.n_clusters}`;
        document.getElementById('resSilhouette').innerText = data.silhouette.toFixed(4);
        document.getElementById('resDB').innerText = data.davies_bouldin.toFixed(4);
        document.getElementById('resCH').innerText = data.calinski_harabasz.toFixed(2);
        document.getElementById('resNoise').innerText = `${(data.noise_ratio * 100).toFixed(1)}%`;

        render3DClusterChart(data.points);
        render2DPCAChart(data.points);
        renderPersonas(data.cluster_summary);
        renderInsights(data.recommendations);
    });
}

function render3DClusterChart(points) {
    const clusters = [...new Set(points.map(p => p.cluster))].sort((a,b) => a - b);
    const traces = clusters.map(c => {
        const cPoints = points.filter(p => p.cluster === c);
        return {
            x: cPoints.map(p => p.income),
            y: cPoints.map(p => p.spending),
            z: cPoints.map(p => p.age),
            mode: 'markers',
            type: 'scatter3d',
            name: c === -1 ? 'Noise' : `Cluster ${c}`,
            marker: { size: 5, opacity: 0.8, color: c === -1 ? '#ef4444' : CLUSTER_COLORS[c % CLUSTER_COLORS.length] }
        };
    });

    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        scene: {
            xaxis: { title: 'Income (k$)', gridcolor: 'rgba(255,255,255,0.1)' },
            yaxis: { title: 'Spending Score', gridcolor: 'rgba(255,255,255,0.1)' },
            zaxis: { title: 'Age', gridcolor: 'rgba(255,255,255,0.1)' }
        }
    };
    Plotly.newPlot('chart3D', traces, layout, { responsive: true, displayModeBar: false });
}

function render2DPCAChart(points) {
    const clusters = [...new Set(points.map(p => p.cluster))].sort((a,b) => a - b);
    const traces = clusters.map(c => {
        const cPoints = points.filter(p => p.cluster === c);
        return {
            x: cPoints.map(p => p.pc1),
            y: cPoints.map(p => p.pc2),
            mode: 'markers',
            type: 'scatter',
            name: c === -1 ? 'Noise' : `Cluster ${c}`,
            marker: { size: 8, opacity: 0.8, color: c === -1 ? '#ef4444' : CLUSTER_COLORS[c % CLUSTER_COLORS.length] }
        };
    });

    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 40, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Principal Component 1', gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { title: 'Principal Component 2', gridcolor: 'rgba(255,255,255,0.05)' }
    };
    Plotly.newPlot('chartPCA', traces, layout, { responsive: true, displayModeBar: false });
}

function renderPersonas(summary) {
    const container = document.getElementById('personaCardsContainer');
    container.innerHTML = summary.map((row, idx) => {
        const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
        return `
            <div class="persona-card-item" style="border-left-color: ${color}">
                <h4><i class="fa-solid fa-user-tag" style="color: ${color}"></i> ${row['Segment Name']}</h4>
                <div class="p-metric"><b>Share:</b> ${row['Customer_Count']} customers (${row['Customer_Percentage']}%)</div>
                <div class="p-metric"><b>Avg Annual Income:</b> $${row['Annual Income (k$)']}k</div>
                <div class="p-metric"><b>Avg Spending Score:</b> ${row['Spending Score (1-100)']}/100</div>
                <div class="p-metric"><b>Avg Purchase Frequency:</b> ${row['Purchase Frequency (per year)']} visits/yr</div>
            </div>
        `;
    }).join('');
}

function renderInsights(recs) {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = Object.entries(recs).map(([cid, info]) => {
        return `
            <div class="glass-card mt-20">
                <h3><i class="fa-solid fa-bullseye accent-blue"></i> Segment ${cid}: ${info.segment_name}</h3>
                <ul class="feature-list mt-20">
                    ${info.recommendations.map(r => `<li><i class="fa-solid fa-check accent-green"></i> ${r}</li>`).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

function uploadCSVFile(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showNotification(data.message);
            fetchStats();
            fetchCustomerData();
            fetchEDA();
            triggerClustering();
        } else {
            showNotification(`Upload Error: ${data.error}`);
        }
    });
}

function toggleViva(btn) {
    const item = btn.closest('.viva-item');
    item.classList.toggle('open');
}
