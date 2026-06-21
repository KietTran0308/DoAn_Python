(() => {
    const API_BASE = 'http://localhost:8000';

    let allLogs = [];        // Dữ liệu gốc từ API
    let filteredLogs = [];   // Dữ liệu sau khi lọc
    let currentPage = 1;
    const rowsPerPage = 10;
    let currentKeyword = '';

    // ==========================================
    // KHỞI TẠO
    // ==========================================
    async function init() {
        await loadLogs();
        initFilters();
        setupEvents();
        applyFilters();
    }

    // ==========================================
    // TẢI DỮ LIỆU TỪ API
    // ==========================================
    async function loadLogs() {
        const tbody = document.getElementById('log-table-body');
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888; padding:20px;">⏳ Đang tải dữ liệu...</td></tr>`;

        try {
            // Không truyền ma_sk -> lấy toàn bộ lịch sử (Admin xem tổng)
            const res = await fetch(`${API_BASE}/api/checkin/logs`);
            if (!res.ok) throw new Error(`Lỗi server: ${res.status}`);
            allLogs = await res.json();
        } catch (err) {
            console.error('Lỗi tải lịch sử check-in:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#dc3545; padding:20px;">❌ Không thể tải dữ liệu. Kiểm tra kết nối server.</td></tr>`;
            if (window.Toast) window.Toast.warning('Không tải được lịch sử check-in.');
        }
    }

    // ==========================================
    // KHỞI TẠO DROPDOWN LỌC TỪ DỮ LIỆU THẬT
    // ==========================================
    function initFilters() {
        // Dropdown sự kiện
        const uniqueEvents = [...new Set(allLogs.map(l => l.ten_su_kien).filter(Boolean))].sort();
        const evtSelect = document.getElementById('filter-event');
        evtSelect.innerHTML = '<option value="">-- Tất cả sự kiện --</option>';
        uniqueEvents.forEach(name => {
            evtSelect.innerHTML += `<option value="${name}">${name}</option>`;
        });

        // Dropdown cổng
        const uniqueGates = [...new Set(allLogs.map(l => l.ten_cong).filter(g => g && g !== 'N/A'))].sort();
        const gateSelect = document.getElementById('filter-gate');
        gateSelect.innerHTML = '<option value="">-- Tất cả cổng --</option>';
        uniqueGates.forEach(g => {
            gateSelect.innerHTML += `<option value="${g}">${g}</option>`;
        });
    }

    // ==========================================
    // GẮN SỰ KIỆN LỌC / TÌM KIẾM
    // ==========================================
    function setupEvents() {
        // SearchComponent custom event
        const searchBox = document.getElementById('search-log');
        if (searchBox) {
            searchBox.addEventListener('search-changed', (e) => {
                currentKeyword = e.detail.value.toLowerCase().trim();
                currentPage = 1;
                applyFilters();
            });
        }

        document.getElementById('filter-event').addEventListener('change', () => { currentPage = 1; applyFilters(); });
        document.getElementById('filter-gate').addEventListener('change', () => { currentPage = 1; applyFilters(); });
        document.getElementById('filter-status').addEventListener('change', () => { currentPage = 1; applyFilters(); });

        // Xuất Excel
        const btnExport = document.querySelector('button');
        if (btnExport) btnExport.addEventListener('click', exportExcel);
    }

    // ==========================================
    // LỌC DỮ LIỆU
    // ==========================================
    function applyFilters() {
        const evtVal    = document.getElementById('filter-event').value;
        const gateVal   = document.getElementById('filter-gate').value;
        const statusVal = document.getElementById('filter-status').value;

        filteredLogs = allLogs.filter(log => {
            const matchKeyword = !currentKeyword ||
                (log.qr_code || '').toLowerCase().includes(currentKeyword) ||
                (log.ten_khach || '').toLowerCase().includes(currentKeyword);

            const matchEvent  = !evtVal    || log.ten_su_kien === evtVal;
            const matchGate   = !gateVal   || log.ten_cong === gateVal;
            const matchStatus = statusVal === '' || log.trang_thai.toString() === statusVal;

            return matchKeyword && matchEvent && matchGate && matchStatus;
        });

        renderTable();
    }

    // ==========================================
    // RENDER BẢNG
    // ==========================================
    function renderTable() {
        const tbody = document.getElementById('log-table-body');
        tbody.replaceChildren();

        if (filteredLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888; padding:20px;">Không tìm thấy lịch sử check-in nào phù hợp.</td></tr>`;
            renderPagination();
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

        pageData.forEach(log => {
            const statusHtml = log.trang_thai === 1
                ? `<span class="badge badge-success">Thành công</span>`
                : `<span class="badge badge-danger">Thất bại</span>`;

            // Hiện tại chỉ có loại IN (hệ thống chưa có OUT)
            const typeHtml = `<span class="badge badge-info">IN</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:#6c757d; font-size:13px;">${log.tg_quet}</td>
                <td style="font-family:monospace; font-weight:bold; color:#007bff;">${log.qr_code}</td>
                <td>
                    <div style="font-weight:500;">${log.ten_su_kien || '<span style="color:#aaa">N/A</span>'}</div>
                    <div style="font-size:12px; color:#888;">${log.ten_khach}${log.email ? ' · ' + log.email : ''}</div>
                </td>
                <td>${log.ten_cong}</td>
                <td style="text-align:center;">${typeHtml}</td>
                <td style="font-size:13px; color:#555;">${log.nhan_vien}</td>
                <td style="text-align:center;">${statusHtml}</td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination();
    }

    // ==========================================
    // PHÂN TRANG
    // ==========================================
    function renderPagination() {
        const container = document.getElementById('log-pagination');
        if (!container) return;
        container.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
        if (totalPages <= 1) return;

        const btnStyle = 'padding:6px 12px; border:1px solid #ddd; border-radius:4px; cursor:pointer; background:white; font-size:14px; user-select:none;';
        const activeStyle = 'background:#007bff; color:white; border-color:#007bff; font-weight:bold;';

        for (let i = 1; i <= totalPages; i++) {
            const span = document.createElement('span');
            span.textContent = i;
            span.style.cssText = btnStyle + (i === currentPage ? activeStyle : '');
            span.addEventListener('click', () => {
                currentPage = i;
                renderTable();
            });
            container.appendChild(span);
        }
    }

    // ==========================================
    // XUẤT EXCEL
    // ==========================================
    function exportExcel() {
        if (filteredLogs.length === 0) {
            if (window.Toast) window.Toast.warning('Không có dữ liệu để xuất.');
            return;
        }

        const headers = ['Thời Gian', 'Mã QR', 'Sự Kiện', 'Khách Hàng', 'Email', 'Cổng Quét', 'NV Soát Vé', 'Trạng Thái'];
        const rows = filteredLogs.map(log => [
            log.tg_quet,
            log.qr_code,
            log.ten_su_kien,
            log.ten_khach,
            log.email,
            log.ten_cong,
            log.nhan_vien,
            log.trang_thai === 1 ? 'Thành công' : 'Thất bại'
        ]);

        // Tạo nội dung CSV
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lich_su_checkin_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // ==========================================
    // CHẠY
    // ==========================================
    init();
})();