(() => {
    // 1. Dữ liệu mô phỏng (Kết hợp từ check_in_log, ve, su_kien, tai_khoan/nguoi_dung)
    const rawLogs = [
        { MA_LOG: 1, QR_CODE: 'QR_TICKET_001', TEN_SK: 'Sky Tour 2026', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-08-15T17:30:00', NV_SOAT_VE: 'Hoàng Nhân Viên 1' },
        { MA_LOG: 2, QR_CODE: 'QR_TICKET_002', TEN_SK: 'Sky Tour 2026', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-08-15T17:32:00', NV_SOAT_VE: 'Hoàng Nhân Viên 1' },
        { MA_LOG: 3, QR_CODE: 'QR_TICKET_003', TEN_SK: 'Sky Tour 2026', TEN_CONG: 'Cổng VIP', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-08-15T18:00:00', NV_SOAT_VE: 'Đỗ Nhân Viên 2' },
        { MA_LOG: 4, QR_CODE: 'QR_TICKET_004', TEN_SK: 'Nhà Hát Kịch IDECAF: TẤM CÁM', TEN_CONG: 'Cổng Chính', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-06-20T19:15:00', NV_SOAT_VE: 'Hoàng Nhân Viên 1' },
        { MA_LOG: 5, QR_CODE: 'QR_TICKET_005', TEN_SK: 'Show của Đen', TEN_CONG: 'Cổng 2', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-09-10T18:30:00', NV_SOAT_VE: 'Đỗ Nhân Viên 2' },
        { MA_LOG: 6, QR_CODE: 'QR_TICKET_006', TEN_SK: 'See Sing Share Concert', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-12-24T18:00:00', NV_SOAT_VE: 'Hoàng Nhân Viên 1' },
        { MA_LOG: 7, QR_CODE: 'QR_TICKET_007', TEN_SK: 'See Sing Share Concert', TEN_CONG: 'Cổng 1', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-12-24T18:01:00', NV_SOAT_VE: 'Hoàng Nhân Viên 1' },
        { MA_LOG: 8, QR_CODE: 'QR_TICKET_008', TEN_SK: 'See Sing Share Concert', TEN_CONG: 'Cổng VIP', LOAI_QUET: 'IN', TRANG_THAI: 0, TG_QUET: '2026-12-24T18:15:00', NV_SOAT_VE: 'Đỗ Nhân Viên 2' },
        { MA_LOG: 9, QR_CODE: 'QR_TICKET_008', TEN_SK: 'See Sing Share Concert', TEN_CONG: 'Cổng VIP', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-12-24T18:16:00', NV_SOAT_VE: 'Đỗ Nhân Viên 2' },
        { MA_LOG: 10, QR_CODE: 'QR_TICKET_009', TEN_SK: 'Tech Summit 2026', TEN_CONG: 'Cổng Chính', LOAI_QUET: 'IN', TRANG_THAI: 1, TG_QUET: '2026-07-05T07:30:00', NV_SOAT_VE: 'Hoàng Nhân Viên 1' }
    ];

    let filteredLogs = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    let currentKeyword = "";

    function init() {
        // Khởi tạo bộ lọc Dropdown từ dữ liệu
        initFilters();
        
        // Cài đặt sự kiện lắng nghe bộ lọc
        setupEvents();

        // Load data lần đầu (Sắp xếp mới nhất lên đầu)
        filteredLogs = [...rawLogs].sort((a, b) => new Date(b.TG_QUET) - new Date(a.TG_QUET));
        renderTable();
    }

    function initFilters() {
        const uniqueEvents = [...new Set(rawLogs.map(l => l.TEN_SK))];
        const uniqueGates = [...new Set(rawLogs.map(l => l.TEN_CONG).filter(g => g))];

        const evtSelect = document.getElementById('filter-event');
        uniqueEvents.forEach(e => evtSelect.innerHTML += `<option value="${e}">${e}</option>`);

        const gateSelect = document.getElementById('filter-gate');
        uniqueGates.forEach(g => gateSelect.innerHTML += `<option value="${g}">${g}</option>`);
    }

    function setupEvents() {
        // Lắng nghe sự kiện từ thanh tìm kiếm (SearchComponent)
        const searchBox = document.getElementById('search-log');
        if (searchBox) {
            searchBox.addEventListener('search-changed', (e) => {
                currentKeyword = e.detail.value.toLowerCase().trim();
                applyFilters();
            });
        }

        // Lắng nghe sự kiện đổi Dropdown
        document.getElementById('filter-event').addEventListener('change', applyFilters);
        document.getElementById('filter-gate').addEventListener('change', applyFilters);
        document.getElementById('filter-status').addEventListener('change', applyFilters);
    }

    function applyFilters() {
        const evtVal = document.getElementById('filter-event').value;
        const gateVal = document.getElementById('filter-gate').value;
        const statusVal = document.getElementById('filter-status').value;

        filteredLogs = rawLogs.filter(log => {
            const matchKeyword = log.QR_CODE.toLowerCase().includes(currentKeyword);
            const matchEvent = evtVal === "" || log.TEN_SK === evtVal;
            const matchGate = gateVal === "" || log.TEN_CONG === gateVal;
            const matchStatus = statusVal === "" || log.TRANG_THAI.toString() === statusVal;

            return matchKeyword && matchEvent && matchGate && matchStatus;
        });

        // Sắp xếp mới nhất lên đầu
        filteredLogs.sort((a, b) => new Date(b.TG_QUET) - new Date(a.TG_QUET));

        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const tbody = document.getElementById('log-table-body');
        tbody.replaceChildren();

        if (filteredLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888; padding: 20px;">Không tìm thấy lịch sử check-in nào phù hợp.</td></tr>`;
            renderPagination();
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

        pageData.forEach(log => {
            const tr = document.createElement('tr');
            
            // Format Thời gian
            const timeStr = new Date(log.TG_QUET).toLocaleString('vi-VN');

            // Format Trạng thái
            let statusHtml = '';
            if (log.TRANG_THAI === 1) {
                statusHtml = `<span class="badge badge-success">Thành công</span>`;
            } else {
                statusHtml = `<span class="badge badge-danger">Thất bại</span>`;
            }

            // Format Loại (IN / OUT)
            let typeHtml = log.LOAI_QUET === 'IN' 
                ? `<span class="badge badge-info">IN</span>` 
                : `<span class="badge" style="background: #e2e3e5; color: #383d41;">OUT</span>`;

            tr.innerHTML = `
                <td style="color: #6c757d; font-size: 13px;">${timeStr}</td>
                <td style="font-family: monospace; font-weight: bold; color: #007bff;">${log.QR_CODE}</td>
                <td style="font-weight: 500;">${log.TEN_SK}</td>
                <td>${log.TEN_CONG || 'N/A'}</td>
                <td style="text-align: center;">${typeHtml}</td>
                <td style="font-size: 13px; color: #555;">${log.NV_SOAT_VE}</td>
                <td style="text-align: center;">${statusHtml}</td>
            `;

            tbody.appendChild(tr);
        });

        renderPagination();
    }

    function renderPagination() {
        const paginationContainer = document.getElementById('log-pagination');
        if (!paginationContainer) return;
        paginationContainer.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
        if (totalPages <= 1) return;

        const btnStyle = "padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: white; user-select: none; font-size: 14px;";
        const activeStyle = "background: #007bff; color: white; border-color: #007bff; font-weight: bold;";

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            pageSpan.style.cssText = btnStyle;

            if (i === currentPage) {
                pageSpan.style.cssText += activeStyle;
            }

            pageSpan.addEventListener('click', () => {
                currentPage = i;
                renderTable();
            });

            paginationContainer.appendChild(pageSpan);
        }
    }

    // Khởi chạy module
    init();
})();