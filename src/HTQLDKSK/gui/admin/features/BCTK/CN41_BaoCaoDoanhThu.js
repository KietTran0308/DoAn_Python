(() => {
    let rawOrders = [];

    // Giả định dữ liệu User đang đăng nhập (Sẽ lấy từ LocalStorage/SessionStorage trong thực tế)
    let currentUserId = 9;
    let currentUserRole = 1; // 1 = Admin, 7 = Organizer

    let barChartInstance = null;
    let pieChartInstance = null;

    async function init() {
        await loadDataFromAPI(); // Gọi API thật
        setupEvents();
        refreshDashboard();
    }

    async function loadDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/bao-cao-doanh-thu');
            if (!response.ok) throw new Error("Lỗi tải dữ liệu");
            rawOrders = await response.json();
        } catch (error) {
            console.error("Lỗi khi tải báo cáo doanh thu:", error);
            alert("Không thể kết nối đến máy chủ.");
        }
    }

    function setupEvents() {
        document.getElementById('filter-time-group').addEventListener('change', refreshDashboard);
        document.getElementById('filter-event').addEventListener('change', refreshDashboard);

        // Mô phỏng việc đổi Role (Admin <-> Organizer)
        const roleSelect = document.getElementById('mock-role-select');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                currentUserRole = parseInt(e.target.value);
                refreshDashboard();
            });
        }
    }

    function refreshDashboard() {
        const timeGroupType = document.getElementById('filter-time-group').value;
        const eventFilter = document.getElementById('filter-event').value;

        // BƯỚC 1: LỌC DỮ LIỆU THEO ROLE (PHÂN QUYỀN)
        let filteredOrders = rawOrders;
        if (currentUserRole === 7) {
            // Nếu là Organizer -> Chỉ lấy đơn hàng thuộc sự kiện mà Organizer này tạo ra
            filteredOrders = rawOrders.filter(o => o.MA_TK_TC === currentUserId);
        }

        // Đổ danh sách Tên sự kiện vào Dropdown filter dựa trên dữ liệu đã được phân quyền
        const uniqueEvents = [...new Set(filteredOrders.map(o => o.TEN_SK))];
        renderEventFilterDropdown(uniqueEvents, eventFilter);

        // BƯỚC 2: LỌC THEO SỰ KIỆN NẾU NGƯỜI DÙNG CHỌN TRONG DROPDOWN
        if (eventFilter !== "") {
            filteredOrders = filteredOrders.filter(o => o.TEN_SK === eventFilter);
        }

        // BƯỚC 3: TÍNH TOÁN VÀ VẼ BIỂU ĐỒ
        processAndRender(filteredOrders, timeGroupType);
    }

    function processAndRender(orders, timeGroupType) {
        let totalRevenue = 0, totalDiscount = 0, successCount = 0, failedCount = 0;
        const revenueByEvent = {};
        const revenueByTime = {};

        orders.forEach(order => {
            if (order.TRANG_THAI === 1) { // 1 = Đã thanh toán
                const amount = parseFloat(order.TONG_TIEN_CON_LAI);
                totalRevenue += amount;
                totalDiscount += parseFloat(order.SO_TIEN_DUOC_GIAM);
                successCount++;

                // Nhóm theo Sự Kiện (Cho Pie Chart)
                revenueByEvent[order.TEN_SK] = (revenueByEvent[order.TEN_SK] || 0) + amount;

                // Thuật toán nhóm thời gian linh hoạt (Cho Bar Chart)
                const date = new Date(order.TG_TAO_DH);
                let timeKey = "";

                if (timeGroupType === 'month') {
                    timeKey = `Tháng ${date.getMonth() + 1}`;
                } else if (timeGroupType === 'quarter') {
                    timeKey = `Quý ${Math.ceil((date.getMonth() + 1) / 3)}`;
                } else if (timeGroupType === 'year') {
                    timeKey = `Năm ${date.getFullYear()}`;
                } else if (timeGroupType === 'week') {
                    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
                    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                    timeKey = `Tuần ${weekNum}`;
                }

                revenueByTime[timeKey] = (revenueByTime[timeKey] || 0) + amount;
            } else {
                failedCount++;
            }
        });

        // Update Text KPI
        document.getElementById('kpi-revenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('kpi-orders').textContent = successCount;
        document.getElementById('kpi-discount').textContent = formatCurrency(totalDiscount);
        document.getElementById('kpi-failed').textContent = failedCount;

        // Update Charts & Lists
        renderRecentTransactions(orders.filter(o => o.TRANG_THAI === 1));
        renderCharts(revenueByTime, revenueByEvent, timeGroupType);
    }

    function renderCharts(dataByTime, dataByEvent, timeGroupType) {
        const typeLabels = { 'month': 'Tháng', 'week': 'Tuần', 'quarter': 'Quý', 'year': 'Năm' };
        document.getElementById('bar-chart-title').textContent = `Biểu đồ Doanh thu theo ${typeLabels[timeGroupType]}`;

        // Bar Chart
        const ctxBar = document.getElementById('revenueBarChart').getContext('2d');
        if (barChartInstance) barChartInstance.destroy();

        const sortedTimeKeys = Object.keys(dataByTime).sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));
        const sortedTimeValues = sortedTimeKeys.map(k => dataByTime[k]);

        barChartInstance = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: sortedTimeKeys.length > 0 ? sortedTimeKeys : ['Chưa có dữ liệu'],
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: sortedTimeValues.length > 0 ? sortedTimeValues : [0],
                    backgroundColor: '#007bff',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });

        // Pie Chart
        const ctxPie = document.getElementById('eventPieChart').getContext('2d');
        if (pieChartInstance) pieChartInstance.destroy();

        pieChartInstance = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: Object.keys(dataByEvent).length > 0 ? Object.keys(dataByEvent) : ['Trống'],
                datasets: [{
                    data: Object.values(dataByEvent).length > 0 ? Object.values(dataByEvent) : [1],
                    backgroundColor: Object.keys(dataByEvent).length > 0 ? ['#007bff', '#28a745', '#f39c12', '#dc3545', '#6f42c1', '#17a2b8'] : ['#e9ecef'],
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
    }

    function renderEventFilterDropdown(events, currentValue) {
        const select = document.getElementById('filter-event');
        select.innerHTML = '<option value="">Tất cả sự kiện</option>';
        events.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            if (name === currentValue) option.selected = true;
            select.appendChild(option);
        });
    }

    function renderRecentTransactions(transactions) {
        const listContainer = document.getElementById('recent-transactions-list');
        listContainer.replaceChildren();
        if (transactions.length === 0) return listContainer.innerHTML = '<p style="color:#888;">Chưa có giao dịch nào.</p>';

        transactions.slice(0, 6).forEach(tx => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.innerHTML = `
                <div class="tx-left">
                    <span class="tx-title">Đơn #${tx.MA_DH} - ${tx.TEN_SK}</span>
                    <span class="tx-date">${formatDate(tx.TG_TAO_DH)}</span>
                </div>
                <div class="tx-right">+ ${formatCurrency(tx.TONG_TIEN_CON_LAI)}</div>
            `;
            listContainer.appendChild(item);
        });
    }

    function formatCurrency(amount) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount); }
    function formatDate(dateString) {
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    init();
})();