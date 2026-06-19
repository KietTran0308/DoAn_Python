(() => {
    let allOrderData = [];
    let currentOrderData = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    let currentSearchKeyword = '';

    function init() {
        loadOrderDataFromAPI();
        setupOrderModal();
        setupSearchAndFilter();
        setupExportExcel();
    }

    async function loadOrderDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/don-hang');
            if (!response.ok) throw new Error("Lỗi API Đơn hàng");
            allOrderData = await response.json();
        } catch (error) {
            console.warn("Sử dụng dữ liệu giả định từ SQL Dump:", error);
        }
        currentOrderData = [...allOrderData];
        currentPage = 1;
        renderOrderTable();
    }

    function getStatusHTML(statusCode, isModal = false) {
        const padding = isModal ? "4px 12px" : "5px 10px";
        switch (parseInt(statusCode)) {
            case 0:
                return `<span style="background-color: #fff3cd; color: #f39c12; padding: ${padding}; border-radius: 20px; font-size: 13px; font-weight: bold;">Chờ thanh toán</span>`;
            case 1:
                return `<span style="background-color: #e0f7fa; color: #28a745; padding: ${padding}; border-radius: 20px; font-size: 13px; font-weight: bold;">Đã thanh toán</span>`;
            case 2:
                return `<span style="background-color: #f8d7da; color: #dc3545; padding: ${padding}; border-radius: 20px; font-size: 13px; font-weight: bold;">Đã hủy</span>`;
            case 3:
                return `<span style="background-color: #e2e3e5; color: #6c757d; padding: ${padding}; border-radius: 20px; font-size: 13px; font-weight: bold;">Đã hoàn tiền</span>`;
            default:
                return `<span style="background-color: #eee; color: #333; padding: ${padding}; border-radius: 20px; font-size: 13px; font-weight: bold;">Không xác định</span>`;
        }
    }

    function getStatusText(statusCode, isModal = false) {
        switch (parseInt(statusCode)) {
            case 0:
                return "Chờ thanh toán";
            case 1:
                return "Đã thanh toán";
            case 2:
                return "Đã hủy";
            case 3:
                return "Đã hoàn tiền";
            default:
                return "Không xác định";
        }
    }

    function renderOrderTable() {
        const tbody = document.getElementById('order-table-body');
        if (!tbody) return;
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = currentOrderData.slice(startIndex, startIndex + rowsPerPage);

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888;">Không tìm thấy đơn hàng nào.</td></tr>`;
            renderOrderPagination();
            return;
        }

        pageData.forEach(order => {
            const tr = document.createElement('tr');

            const d = new Date(order.TG_TAO_DH);
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            const moneyStr = parseInt(order.TONG_TIEN_CON_LAI).toLocaleString('vi-VN') + ' đ';

            // Lấy giao diện trạng thái
            const statusHtml = getStatusHTML(order.TRANG_THAI, false);

            tr.innerHTML = `
                <td><b>ĐH${order.MA_DH.toString().padStart(5, '0')}</b></td>
                <td style="color: #0984e3; font-weight: bold;">@${order.TEN_TK}</td>
                <td>${order.TEN_SK}</td>
                <td>${dateStr}</td>
                <td style="color: #28a745; font-weight: bold;">${moneyStr}</td>
                <td style="text-align: center;">${statusHtml}</td>
                <td class="actions">
                    <img src="/img/INFO.png" alt="Chi tiết" class="action-icon" title="Xem chi tiết đơn hàng">
                </td>
            `;

            const infoIcon = tr.querySelector('img[alt="Chi tiết"]');
            infoIcon.addEventListener('click', () => openOrderModal(order));

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

    function setupSearchAndFilter() {
        const filterStatus = document.getElementById('filter-status');

        function applyAllFilters() {
            const statusVal = filterStatus ? filterStatus.value : '';

            currentOrderData = allOrderData.filter(order => {
                let matchKeyword = true;
                if (currentSearchKeyword) {
                    matchKeyword =
                        (order.TEN_TK && order.TEN_TK.toLowerCase().includes(currentSearchKeyword)) ||
                        (order.TEN_SK && order.TEN_SK.toLowerCase().includes(currentSearchKeyword)) ||
                        (order.MA_DH && `đh${order.MA_DH}`.includes(currentSearchKeyword.replace(/\s/g, '')));
                }

                let matchStatus = true;
                if (statusVal !== '') {
                    const statusHtml = getStatusText(order.TRANG_THAI, false);
                    matchStatus = (statusHtml === statusVal);
                }

                return matchKeyword && matchStatus;
            });

            currentPage = 1;
            renderOrderTable();
        }

        // Bắt sự kiện gõ chữ từ <search-box>
        document.addEventListener('search-changed', (e) => {
            currentSearchKeyword = e.detail.value.toLowerCase().trim();
            applyAllFilters();
        });

        if (filterStatus) filterStatus.addEventListener('change', applyAllFilters);

        // Bắt sự kiện bấm nút phân trang
        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'order-pagination') {
                currentPage = e.detail.page;
                renderOrderTable();
            }
        });
    }

    function setupOrderModal() {
        const modal = document.getElementById('order-modal');
        const closeBtn = document.getElementById('close-order-modal');
        const cancelBtn = document.getElementById('cancel-order-btn');

        if (!modal) return;

        const closeModal = () => { modal.style.display = 'none'; };

        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function openOrderModal(order) {
        const modal = document.getElementById('order-modal');
        if(!modal) return;

        // 1. Map dữ liệu cơ bản
        document.getElementById('detail-ma-dh-header').textContent = `#${order.MA_DH.toString().padStart(5, '0')}`;

        const dateObj = new Date(order.TG_TAO_DH);
        document.getElementById('detail-ngay-dat').textContent = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

        document.getElementById('detail-khach-hang').textContent = `@${order.TEN_TK}`;
        document.getElementById('detail-su-kien').textContent = order.TEN_SK;

        document.getElementById('detail-tong-ban-dau').textContent = `${parseInt(order.TONG_TIEN_BAN_DAU).toLocaleString('vi-VN')} đ`;
        document.getElementById('detail-giam-gia').textContent = `- ${parseInt(order.SO_TIEN_DUOC_GIAM).toLocaleString('vi-VN')} đ`;
        document.getElementById('detail-thanh-tien').textContent = `${parseInt(order.TONG_TIEN_CON_LAI).toLocaleString('vi-VN')} đ`;

        // 2. Render Badge Trạng thái & Nút Xác nhận
        const statusEl = document.getElementById('detail-trang-thai');
        const updateBtn = document.getElementById('update-order-status-btn');

        if (order.TRANG_THAI === 1) {
            statusEl.innerHTML = `<span style="background-color: #e0f7fa; color: #28a745; padding: 4px 12px; border-radius: 20px; font-weight: bold;">✅ Đã thanh toán</span>`;
            if(updateBtn) updateBtn.style.display = 'none';
        } else {
            statusEl.innerHTML = `<span style="background-color: #fff3cd; color: #f39c12; padding: 4px 12px; border-radius: 20px; font-weight: bold;">⏳ Chờ thanh toán</span>`;
            if(updateBtn) {
                updateBtn.style.display = 'block';
                updateBtn.onclick = () => {
                    alert(`✅ Đã xác nhận thanh toán thủ công cho ĐH${order.MA_DH.toString().padStart(5, '0')}!`);
                    order.TRANG_THAI = 1;
                    modal.style.display = 'none';
                    // Render lại bảng bên ngoài
                    renderOrderTable();
                };
            }
        }

        // 3. Render Bảng chi tiết vé
        const tbodyTickets = document.getElementById('detail-ticket-list');
        tbodyTickets.replaceChildren();

        // Xử lý dữ liệu vé (Nếu API backend của bạn có trả mảng 'chi_tiet_ve', ta dùng nó. Nếu chưa có, ta chia tạm tổng tiền để hiển thị giao diện mẫu)
        let dsVe = order.chi_tiet_ve || [
            { ten_ve: 'Vé Standard - Khán đài', so_luong: 1, don_gia: parseInt(order.TONG_TIEN_BAN_DAU) }
        ];

        dsVe.forEach(ve => {
            const tr = document.createElement('tr');
            const thanhTien = ve.so_luong * ve.don_gia;
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 500;">${ve.ten_ve}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${ve.so_luong}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">${ve.don_gia.toLocaleString('vi-VN')} đ</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${thanhTien.toLocaleString('vi-VN')} đ</td>
            `;
            tbodyTickets.appendChild(tr);
        });

        modal.style.display = 'flex';
    }

    function setupExportExcel() {
        const btnExport = document.getElementById('btn-export-orders');
        if (btnExport) {
            btnExport.addEventListener('click', exportToExcel);
        }
    }

    function exportToExcel() {
        // Chỉ xuất những dữ liệu ĐANG ĐƯỢC LỌC hiển thị trên bảng
        if (currentOrderData.length === 0) {
            alert("Không có dữ liệu đơn hàng nào để xuất!");
            return;
        }

        // \uFEFF là cờ BOM giúp Excel đọc đúng font Tiếng Việt UTF-8
        let csvContent = "\uFEFF";

        // Tạo dòng Tiêu đề (Header)
        csvContent += "Mã ĐH,Khách hàng,Sự kiện,Ngày đặt,Tổng tiền (VND),Trạng thái\n";

        // Lặp qua dữ liệu và gom thành từng dòng CSV
        currentOrderData.forEach(order => {
            const maDH = `ĐH${order.MA_DH.toString().padStart(5, '0')}`;
            const khachHang = `@${order.TEN_TK}`;
            const suKien = `"${order.TEN_SK}"`; // Bọc ngoặc kép để tránh lỗi nếu tên có dấu phẩy

            const d = new Date(order.TG_TAO_DH);
            const ngayDat = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

            const tongTien = parseInt(order.TONG_TIEN_CON_LAI);

            let trangThai = '';
            switch (parseInt(order.TRANG_THAI)) {
                case 0: trangThai = "Chờ thanh toán"; break;
                case 1: trangThai = "Đã thanh toán"; break;
                case 2: trangThai = "Đã hủy"; break;
                case 3: trangThai = "Đã hoàn tiền"; break;
                default: trangThai = "Không xác định";
            }

            // Ghép nối các cột
            csvContent += `${maDH},${khachHang},${suKien},${ngayDat},${tongTien},${trangThai}\n`;
        });

        // Tạo file và tự động tải xuống
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", "Danh_Sach_Don_Hang.csv"); // Tên file tải về
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    init();
})();