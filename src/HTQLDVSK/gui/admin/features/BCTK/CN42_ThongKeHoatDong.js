(() => {
    const API_BASE = 'http://localhost:8000';

    let allLogs = [];       // Toàn bộ log từ API
    let timelineChart = null;
    let gatesChart = null;

    // KHỞI TẠO
    async function init() {
        await loadLogs();
        buildEventDropdown();
        setupEvents();
        renderDashboard();
    }

    // TẢI DỮ LIỆU
    async function loadLogs() {
        try {
            const res = await fetch(`${API_BASE}/api/thong-ke-hoat-dong`);
            if (!res.ok) throw new Error(`Lỗi server: ${res.status}`);
            allLogs = await res.json();
        } catch (err) {
            console.error('Lỗi tải thống kê hoạt động:', err);
            if (window.Toast) window.Toast.warning('Không tải được dữ liệu thống kê. Kiểm tra kết nối server.');
        }
    }

    // BUILD DROPDOWN SỰ KIỆN TỪ DATA THẬT
    function buildEventDropdown() {
        const select = document.getElementById('filter-event');
        const seen = new Map(); // MA_SK -> TEN_SK
        allLogs.forEach(l => {
            if (l.ma_sk && !seen.has(l.ma_sk)) seen.set(l.ma_sk, l.ten_su_kien);
        });

        select.innerHTML = '<option value="">-- Tất cả sự kiện --</option>';
        seen.forEach((ten, ma) => {
            select.innerHTML += `<option value="${ma}">${ten}</option>`;
        });
    }

    // GẮN SỰ KIỆN LỌC
    function setupEvents() {
        document.getElementById('filter-event').addEventListener('change', renderDashboard);
        document.getElementById('filter-date').addEventListener('change', renderDashboard);

        // Nút làm mới
        const btnRefresh = document.querySelector('button');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', async () => {
                btnRefresh.textContent = '⏳ Đang tải...';
                btnRefresh.disabled = true;
                await loadLogs();
                buildEventDropdown();
                renderDashboard();
                btnRefresh.textContent = '🔄 Làm mới dữ liệu';
                btnRefresh.disabled = false;
            });
        }
    }

    // LỌC VÀ RENDER TOÀN BỘ DASHBOARD
    function renderDashboard() {
        const maSkFilter  = document.getElementById('filter-event').value;
        const dateFilter  = document.getElementById('filter-date').value;
        const today       = new Date().toISOString().slice(0, 10);

        let logs = allLogs.filter(l => {
            const matchEvent = !maSkFilter || String(l.ma_sk) === String(maSkFilter);
            const matchDate  = dateFilter !== 'today' || l.tg_quet.startsWith(today);
            return matchEvent && matchDate;
        });

        // --- KPI ---
        const validScans   = logs.filter(l => l.trang_thai === 1).length;
        const invalidScans = logs.filter(l => l.trang_thai === 0).length;
        const activeGates  = new Set(logs.map(l => l.ten_cong).filter(Boolean)).size;

        document.getElementById('kpi-total-scans').textContent  = logs.length;
        document.getElementById('kpi-valid-scans').textContent  = validScans;
        document.getElementById('kpi-invalid-scans').textContent = invalidScans;
        document.getElementById('kpi-active-gates').textContent = activeGates;

        // --- Nhóm theo khung giờ (chỉ lượt thành công) ---
        const timelineStats = {};
        logs.filter(l => l.trang_thai === 1).forEach(l => {
            const hour = new Date(l.tg_quet).getHours();
            const key  = `${hour.toString().padStart(2, '0')}:00`;
            timelineStats[key] = (timelineStats[key] || 0) + 1;
        });

        // --- Nhóm theo cổng (tất cả lượt) ---
        const gateStats = {};
        logs.forEach(l => {
            const gate = l.ten_cong || 'Không xác định';
            gateStats[gate] = (gateStats[gate] || 0) + 1;
        });

        renderCharts(timelineStats, gateStats);
        renderRecentLogs(logs);
    }

    // VẼ BIỂU ĐỒ
    function renderCharts(timelineStats, gateStats) {
        // Biểu đồ Line — lưu lượng theo khung giờ
        const ctxLine = document.getElementById('timelineChart').getContext('2d');
        if (timelineChart) timelineChart.destroy();

        const sortedHours  = Object.keys(timelineStats).sort();
        const hourValues   = sortedHours.map(h => timelineStats[h]);

        timelineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: sortedHours.length ? sortedHours : ['Trống'],
                datasets: [{
                    label: 'Lượt Check-in hợp lệ',
                    data: hourValues.length ? hourValues : [0],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40,167,69,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });

        // Biểu đồ Bar ngang — phân bổ theo cổng
        const ctxGates = document.getElementById('gatesChart').getContext('2d');
        if (gatesChart) gatesChart.destroy();

        const gateLabels = Object.keys(gateStats);
        const gateValues = Object.values(gateStats);

        gatesChart = new Chart(ctxGates, {
            type: 'bar',
            data: {
                labels: gateLabels.length ? gateLabels : ['Trống'],
                datasets: [{
                    label: 'Lượt quét',
                    data: gateValues.length ? gateValues : [0],
                    backgroundColor: [
                        '#007bff','#28a745','#f39c12','#dc3545',
                        '#6f42c1','#17a2b8','#fd7e14','#20c997'
                    ]
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }

    // DANH SÁCH LOG GẦN NHẤT
    function renderRecentLogs(logs) {
        const container = document.getElementById('recent-logs-list');
        container.replaceChildren();

        if (logs.length === 0) {
            container.innerHTML = '<p style="color:#888; font-size:14px;">Chưa có dữ liệu quét vé.</p>';
            return;
        }

        // Lấy 7 log mới nhất (đã sort DESC từ server)
        logs.slice(0, 7).forEach(log => {
            const timeStr    = new Date(log.tg_quet).toLocaleString('vi-VN');
            const statusBadge = log.trang_thai === 1
                ? '<span class="badge badge-success">Hợp lệ</span>'
                : '<span class="badge badge-danger">Từ chối</span>';

            const item = document.createElement('div');
            item.className = 'log-item';
            item.innerHTML = `
                <div class="log-left">
                    <span class="log-title">${log.ten_khach || 'Không xác định'} — ${log.ten_cong}</span>
                    <span class="log-desc">${log.ten_su_kien || ''} · ${timeStr}</span>
                </div>
                <div>${statusBadge}</div>
            `;
            container.appendChild(item);
        });
    }

    init();
})();