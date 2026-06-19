(() => {
    // Dữ liệu mô phỏng dựa trên bảng check_in_log và su_kien từ SQL của bạn
    const rawLogs = [
        { MA_LOG: 1, MA_VE: 1, TEN_SK: 'Sky Tour 2026', MA_TK_TC: 9, TG_QUET: '2026-08-15T17:30:00', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 2, MA_VE: 2, TEN_SK: 'Sky Tour 2026', MA_TK_TC: 9, TG_QUET: '2026-08-15T17:32:00', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 3, MA_VE: 3, TEN_SK: 'Sky Tour 2026', MA_TK_TC: 9, TG_QUET: '2026-08-15T18:00:00', TEN_CONG: 'Cổng VIP', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 4, MA_VE: 4, TEN_SK: 'Nhà Hát Kịch IDECAF', MA_TK_TC: 15, TG_QUET: '2026-06-20T19:15:00', TEN_CONG: 'Cổng Chính', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 5, MA_VE: 5, TEN_SK: 'Show của Đen', MA_TK_TC: 15, TG_QUET: '2026-09-10T18:30:00', TEN_CONG: 'Cổng 2', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 6, MA_VE: 6, TEN_SK: 'See Sing Share Concert', MA_TK_TC: 9, TG_QUET: '2026-12-24T18:00:00', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 7, MA_VE: 7, TEN_SK: 'See Sing Share Concert', MA_TK_TC: 9, TG_QUET: '2026-12-24T18:01:00', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 8, MA_VE: 8, TEN_SK: 'See Sing Share Concert', MA_TK_TC: 9, TG_QUET: '2026-12-24T18:15:00', TEN_CONG: 'Cổng VIP', LOAI_QUET: 'IN', TRANG_THAI: 0 }, // Cảnh báo lỗi
        { MA_LOG: 9, MA_VE: 8, TEN_SK: 'See Sing Share Concert', MA_TK_TC: 9, TG_QUET: '2026-12-24T18:16:00', TEN_CONG: 'Cổng VIP', LOAI_QUET: 'IN', TRANG_THAI: 1 },
        { MA_LOG: 10, MA_VE: 9, TEN_SK: 'Tech Summit 2026', MA_TK_TC: 20, TG_QUET: '2026-07-05T07:30:00', TEN_CONG: 'Cổng Chính', LOAI_QUET: 'IN', TRANG_THAI: 1 }
    ];

    let timelineChartInstance = null;
    let gatesChartInstance = null;

    // Giả định: Người đang đăng nhập có Role Organizer (Có thể kết hợp logic giống file Báo cáo Doanh thu)
    let currentUserId = null; 
    let currentUserRole = 1; // 1: Admin (thấy tất cả)

    function init() {
        setupEvents();
        refreshDashboard();
    }

    function setupEvents() {
        document.getElementById('filter-event').addEventListener('change', renderDashboardData);
        document.getElementById('filter-date').addEventListener('change', renderDashboardData);
    }

    function refreshDashboard() {
        // Lọc dữ liệu thô ban đầu theo Role (Admin vs Organizer)
        let accessibleLogs = rawOrdersFilter(rawLogs);

        // Nạp Dropdown Sự kiện
        const uniqueEvents = [...new Set(accessibleLogs.map(l => l.TEN_SK))];
        const select = document.getElementById('filter-event');
        select.innerHTML = '<option value="">-- Tất cả sự kiện --</option>';
        uniqueEvents.forEach(evt => {
            select.innerHTML += `<option value="${evt}">${evt}</option>`;
        });

        // Trigger render
        renderDashboardData();
    }

    function rawOrdersFilter(logs) {
        if (currentUserRole === 7) {
            return logs.filter(l => l.MA_TK_TC === currentUserId);
        }
        return logs;
    }

    function renderDashboardData() {
        const eventFilter = document.getElementById('filter-event').value;
        let logsToProcess = rawOrdersFilter(rawLogs);

        if (eventFilter) {
            logsToProcess = logsToProcess.filter(l => l.TEN_SK === eventFilter);
        }

        // --- Xử lý Data ---
        let validScans = 0;
        let invalidScans = 0;
        const gateStats = {};
        const timelineStats = {};

        logsToProcess.forEach(log => {
            if (log.TRANG_THAI === 1) validScans++;
            else invalidScans++;

            // Nhóm theo Cổng
            const gate = log.TEN_CONG || 'Không xác định';
            gateStats[gate] = (gateStats[gate] || 0) + 1;

            // Nhóm theo Khung giờ (Lấy giờ: 17:00, 18:00...)
            if(log.TRANG_THAI === 1) {
                const dateObj = new Date(log.TG_QUET);
                const hourKey = `${dateObj.getHours()}:00`;
                timelineStats[hourKey] = (timelineStats[hourKey] || 0) + 1;
            }
        });

        // Cập nhật KPI
        document.getElementById('kpi-total-scans').textContent = logsToProcess.length;
        document.getElementById('kpi-valid-scans').textContent = validScans;
        document.getElementById('kpi-invalid-scans').textContent = invalidScans;
        document.getElementById('kpi-active-gates').textContent = Object.keys(gateStats).length;

        // Render Biểu đồ & Danh sách
        renderCharts(timelineStats, gateStats);
        renderRecentLogs(logsToProcess);
    }

    function renderCharts(timelineStats, gateStats) {
        // Biểu đồ Line (Khung giờ)
        const ctxLine = document.getElementById('timelineChart').getContext('2d');
        if (timelineChartInstance) timelineChartInstance.destroy();

        // Sắp xếp các mốc giờ tăng dần
        const sortedHours = Object.keys(timelineStats).sort((a,b) => parseInt(a) - parseInt(b));
        const hourValues = sortedHours.map(h => timelineStats[h]);

        timelineChartInstance = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: sortedHours.length > 0 ? sortedHours : ['Trống'],
                datasets: [{
                    label: 'Lượt Check-in',
                    data: hourValues.length > 0 ? hourValues : [0],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Biểu đồ Bar Ngang (Cổng)
        const ctxGates = document.getElementById('gatesChart').getContext('2d');
        if (gatesChartInstance) gatesChartInstance.destroy();

        gatesChartInstance = new Chart(ctxGates, {
            type: 'bar',
            data: {
                labels: Object.keys(gateStats).length > 0 ? Object.keys(gateStats) : ['Trống'],
                datasets: [{
                    label: 'Lượt quét',
                    data: Object.values(gateStats).length > 0 ? Object.values(gateStats) : [0],
                    backgroundColor: '#007bff'
                }]
            },
            options: { 
                indexAxis: 'y', // Chuyển thành biểu đồ cột ngang
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } } 
            }
        });
    }

    function renderRecentLogs(logs) {
        const listContainer = document.getElementById('recent-logs-list');
        listContainer.replaceChildren();

        if (logs.length === 0) return listContainer.innerHTML = '<p style="color:#888;">Chưa có dữ liệu quét vé.</p>';

        // Đảo ngược mảng để xem mới nhất trước
        const recent = [...logs].reverse().slice(0, 7);

        recent.forEach(log => {
            const item = document.createElement('div');
            item.className = 'log-item';
            
            const timeStr = new Date(log.TG_QUET).toLocaleString('vi-VN');
            const statusBadge = log.TRANG_THAI === 1 
                ? '<span class="badge badge-success">Hợp lệ</span>' 
                : '<span class="badge badge-danger">Từ chối</span>';

            item.innerHTML = `
                <div class="log-left">
                    <span class="log-title">Vé #${log.MA_VE} - ${log.TEN_CONG}</span>
                    <span class="log-desc">${log.TEN_SK} • ${timeStr}</span>
                </div>
                <div>${statusBadge}</div>
            `;
            listContainer.appendChild(item);
        });
    }

    init();
})();