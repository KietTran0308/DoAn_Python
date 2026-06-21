(() => {
    const API_BASE = 'http://localhost:8000';

    let allOrderData     = [];
    let currentOrderData = [];
    let currentPage      = 1;
    const rowsPerPage    = 10;
    let currentSearchKeyword = '';

    // ==========================================
    // KHỞI TẠO
    // ==========================================
    function init() {
        loadOrderDataFromAPI();
        setupOrderModal();
        setupSearchAndFilter();
        setupExportExcel();
    }

    // ==========================================
    // TẢI DANH SÁCH ĐƠN HÀNG
    // ==========================================
    async function loadOrderDataFromAPI() {
        const tbody = document.getElementById('order-table-body');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">⏳ Đang tải...</td></tr>`;

        try {
            const response = await fetch(`${API_BASE}/api/don-hang`);
            if (!response.ok) throw new Error('Lỗi API Đơn hàng');
            allOrderData = await response.json();
        } catch (error) {
            console.error('Lỗi tải đơn hàng:', error);
            if (window.Toast) window.Toast.warning('Không tải được danh sách đơn hàng.');
        }

        currentOrderData = [...allOrderData];
        currentPage = 1;
        renderOrderTable();
    }

    // ==========================================
    // HELPER: BADGE TRẠNG THÁI
    // ==========================================
    const STATUS_MAP = {
        0: { label: 'Chờ thanh toán', bg: '#fff3cd', color: '#f39c12' },
        1: { label: 'Đã thanh toán',  bg: '#e0f7fa', color: '#28a745' },
        2: { label: 'Đã hủy',         bg: '#f8d7da', color: '#dc3545' },
        3: { label: 'Đã hoàn tiền',   bg: '#e2e3e5', color: '#6c757d' },
    };

    function getStatusHTML(code, padding = '5px 10px') {
        const s = STATUS_MAP[parseInt(code)] || { label: 'Không xác định', bg: '#eee', color: '#333' };
        return `<span style="background:${s.bg};color:${s.color};padding:${padding};border-radius:20px;font-size:13px;font-weight:bold;">${s.label}</span>`;
    }

    function getStatusLabel(code) {
        return (STATUS_MAP[parseInt(code)] || { label: 'Không xác định' }).label;
    }

    // ==========================================
    // RENDER BẢNG
    // ==========================================
    function renderOrderTable() {
        const tbody = document.getElementById('order-table-body');
        if (!tbody) return;
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData   = currentOrderData.slice(startIndex, startIndex + rowsPerPage);

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Không tìm thấy đơn hàng nào.</td></tr>`;
            renderOrderPagination();
            return;
        }

        pageData.forEach(order => {
            const d       = new Date(order.TG_TAO_DH);
            const dateStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
            const moneyStr = parseInt(order.TONG_TIEN_CON_LAI).toLocaleString('vi-VN') + ' đ';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>ĐH${order.MA_DH.toString().padStart(5,'0')}</b></td>
                <td style="color:#0984e3;font-weight:bold;">@${order.TEN_TK}</td>
                <td>${order.TEN_SK}</td>
                <td>${dateStr}</td>
                <td style="color:#28a745;font-weight:bold;">${moneyStr}</td>
                <td style="text-align:center;">${getStatusHTML(order.TRANG_THAI)}</td>
                <td class="actions">
                    <img src="/img/INFO.png" alt="Chi tiết" class="action-icon" title="Xem chi tiết đơn hàng" style="cursor:pointer;">
                </td>
            `;

            tr.querySelector('img[alt="Chi tiết"]').addEventListener('click', () => openOrderModal(order));
            tbody.appendChild(tr);
        });

        renderOrderPagination();
    }

    function renderOrderPagination() {
        const paginationContainer = document.getElementById('order-pagination');
        if (!paginationContainer) return;
        const totalPages = Math.max(1, Math.ceil(currentOrderData.length / rowsPerPage));
        paginationContainer.setAttribute('total-pages', totalPages);
        paginationContainer.setAttribute('current-page', currentPage);
    }

    // ==========================================
    // TÌM KIẾM & LỌC
    // ==========================================
    function setupSearchAndFilter() {
        const filterStatus = document.getElementById('filter-status');

        function applyAllFilters() {
            const statusVal = filterStatus ? filterStatus.value : '';

            currentOrderData = allOrderData.filter(order => {
                const matchKeyword = !currentSearchKeyword || (
                    (order.TEN_TK  && order.TEN_TK.toLowerCase().includes(currentSearchKeyword)) ||
                    (order.TEN_SK  && order.TEN_SK.toLowerCase().includes(currentSearchKeyword)) ||
                    `đh${order.MA_DH}`.includes(currentSearchKeyword.replace(/\s/g, ''))
                );
                const matchStatus = !statusVal || getStatusLabel(order.TRANG_THAI) === statusVal;
                return matchKeyword && matchStatus;
            });

            currentPage = 1;
            renderOrderTable();
        }

        document.addEventListener('search-changed', (e) => {
            currentSearchKeyword = e.detail.value.toLowerCase().trim();
            applyAllFilters();
        });

        if (filterStatus) filterStatus.addEventListener('change', applyAllFilters);

        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'order-pagination') {
                currentPage = e.detail.page;
                renderOrderTable();
            }
        });
    }

    // ==========================================
    // MODAL CHI TIẾT
    // ==========================================
    function setupOrderModal() {
        const modal    = document.getElementById('order-modal');
        const closeBtn = document.getElementById('close-order-modal');
        const cancelBtn = document.getElementById('cancel-order-btn');
        if (!modal) return;

        const closeModal = () => { modal.style.display = 'none'; };
        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    async function openOrderModal(order) {
        const modal = document.getElementById('order-modal');
        if (!modal) return;

        // --- Thông tin cơ bản ---
        document.getElementById('detail-ma-dh-header').textContent = `#ĐH${order.MA_DH.toString().padStart(5,'0')}`;

        const d = new Date(order.TG_TAO_DH);
        document.getElementById('detail-ngay-dat').textContent =
            `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

        document.getElementById('detail-khach-hang').textContent = `@${order.TEN_TK}`;
        document.getElementById('detail-su-kien').textContent    = order.TEN_SK;

        document.getElementById('detail-tong-ban-dau').textContent = `${parseInt(order.TONG_TIEN_BAN_DAU).toLocaleString('vi-VN')} đ`;
        document.getElementById('detail-giam-gia').textContent     = `- ${parseInt(order.SO_TIEN_DUOC_GIAM).toLocaleString('vi-VN')} đ`;
        document.getElementById('detail-thanh-tien').textContent   = `${parseInt(order.TONG_TIEN_CON_LAI).toLocaleString('vi-VN')} đ`;

        // --- Trạng thái & nút hành động ---
        renderModalStatus(order);

        // --- Bảng vé: gọi API chi tiết ---
        const tbodyTickets = document.getElementById('detail-ticket-list');
        tbodyTickets.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#888;padding:12px;">⏳ Đang tải chi tiết vé...</td></tr>`;

        modal.style.display = 'flex';

        try {
            const res = await fetch(`${API_BASE}/api/don-hang/${order.MA_DH}/chi-tiet`);
            if (!res.ok) throw new Error('Lỗi tải chi tiết vé');
            const dsVe = await res.json();
            renderTicketList(tbodyTickets, dsVe, order);
        } catch (err) {
            console.error(err);
            tbodyTickets.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#dc3545;padding:12px;">Không tải được chi tiết vé.</td></tr>`;
        }
    }

    function renderModalStatus(order) {
        const statusEl  = document.getElementById('detail-trang-thai');
        const updateBtn = document.getElementById('update-order-status-btn');

        statusEl.innerHTML = getStatusHTML(order.TRANG_THAI, '4px 12px');

        if (!updateBtn) return;

        const trangThai = parseInt(order.TRANG_THAI);

        // Chỉ hiện nút "Xác nhận thanh toán" khi đơn đang Chờ (0)
        if (trangThai === 0) {
            updateBtn.style.display = 'block';
            updateBtn.textContent   = '✅ Xác nhận đã thanh toán';
            updateBtn.style.backgroundColor = '#28a745';
            updateBtn.onclick = () => confirmUpdateStatus(order, 1);
        }
        // Hiện nút "Hủy đơn" khi đơn đang Chờ (0) hoặc Đã thanh toán (1)
        else if (trangThai === 1) {
            updateBtn.style.display = 'block';
            updateBtn.textContent   = '🚫 Hủy đơn hàng';
            updateBtn.style.backgroundColor = '#dc3545';
            updateBtn.onclick = () => confirmUpdateStatus(order, 2);
        } else {
            updateBtn.style.display = 'none';
        }
    }

    async function confirmUpdateStatus(order, trangThaiMoi) {
        const labels = { 1: 'xác nhận thanh toán', 2: 'hủy' };
        const confirmed = window.confirm(`Bạn có chắc muốn ${labels[trangThaiMoi]} đơn hàng #ĐH${order.MA_DH.toString().padStart(5,'0')}?`);
        if (!confirmed) return;

        try {
            const res = await fetch(`${API_BASE}/api/don-hang/${order.MA_DH}/trang-thai`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trang_thai: trangThaiMoi })
            });
            if (!res.ok) throw new Error('Lỗi cập nhật');

            // Cập nhật local data
            order.TRANG_THAI = trangThaiMoi;
            const idx = allOrderData.findIndex(o => o.MA_DH === order.MA_DH);
            if (idx !== -1) allOrderData[idx].TRANG_THAI = trangThaiMoi;

            if (window.Toast) window.Toast.success('Cập nhật trạng thái thành công!');

            // Làm mới modal và bảng
            renderModalStatus(order);
            renderOrderTable();
        } catch (err) {
            console.error(err);
            if (window.Toast) window.Toast.warning('Cập nhật thất bại. Thử lại sau.');
        }
    }

    function renderTicketList(tbody, dsVe, order) {
        tbody.replaceChildren();

        // Nếu backend chưa trả dữ liệu vé (đơn cũ / lỗi JOIN), hiển thị tổng tiền tạm
        if (!dsVe || dsVe.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:10px;border-bottom:1px solid #eee;font-weight:500;">Vé — ${order.TEN_SK}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">—</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:#666;">—</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">${parseInt(order.TONG_TIEN_BAN_DAU).toLocaleString('vi-VN')} đ</td>
            `;
            tbody.appendChild(tr);
            return;
        }

        dsVe.forEach(ve => {
            const thanhTien = ve.so_luong * ve.don_gia;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:10px;border-bottom:1px solid #eee;font-weight:500;">${ve.ten_ve}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${ve.so_luong}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:#666;">${ve.don_gia.toLocaleString('vi-VN')} đ</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">${thanhTien.toLocaleString('vi-VN')} đ</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // XUẤT CSV
    // ==========================================
    function setupExportExcel() {
        const btnExport = document.getElementById('btn-export-orders');
        if (btnExport) btnExport.addEventListener('click', exportToCSV);
    }

    function exportToCSV() {
        if (currentOrderData.length === 0) {
            if (window.Toast) window.Toast.warning('Không có dữ liệu đơn hàng nào để xuất!');
            return;
        }

        const headers = ['Mã ĐH', 'Khách hàng', 'Sự kiện', 'Ngày đặt', 'Tổng tiền (VND)', 'Trạng thái'];
        const rows = currentOrderData.map(order => {
            const d = new Date(order.TG_TAO_DH);
            return [
                `ĐH${order.MA_DH.toString().padStart(5,'0')}`,
                `@${order.TEN_TK}`,
                order.TEN_SK,
                `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`,
                parseInt(order.TONG_TIEN_CON_LAI),
                getStatusLabel(order.TRANG_THAI)
            ];
        });

        const csv = [headers, ...rows]
            .map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `don_hang_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    // ==========================================
    // CHẠY
    // ==========================================
    init();
})();