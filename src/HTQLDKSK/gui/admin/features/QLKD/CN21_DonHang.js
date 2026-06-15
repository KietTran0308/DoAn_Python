(() => {
    let currentOrderData = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    function init() {
        loadOrderDataFromAPI();
        setupOrderModal();
    }

    async function loadOrderDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/don-hang');
            if (!response.ok) throw new Error("Lỗi API Đơn hàng");
            currentOrderData = await response.json();
        } catch (error) {
            console.warn("Sử dụng dữ liệu giả định từ SQL Dump:", error);
            // Dữ liệu mẫu dựa trên SQL bạn cung cấp (đã JOIN bảng tai_khoan và su_kien)
            currentOrderData = [
                { MA_DH: 1, TEN_TK: 'customer_a', TEN_SK: 'Sky Tour 2026', TONG_TIEN_BAN_DAU: 5000000.00, SO_TIEN_DUOC_GIAM: 0.00, TONG_TIEN_CON_LAI: 5000000.00, TG_TAO_DH: '2026-05-10T10:00:00', TRANG_THAI: 1 },
                { MA_DH: 2, TEN_TK: 'customer_b', TEN_SK: 'Sky Tour 2026', TONG_TIEN_BAN_DAU: 5000000.00, SO_TIEN_DUOC_GIAM: 50000.00, TONG_TIEN_CON_LAI: 4950000.00, TG_TAO_DH: '2026-05-11T11:00:00', TRANG_THAI: 1 },
                { MA_DH: 3, TEN_TK: 'vip_user1', TEN_SK: 'Sky Tour 2026', TONG_TIEN_BAN_DAU: 10000000.00, SO_TIEN_DUOC_GIAM: 500000.00, TONG_TIEN_CON_LAI: 9500000.00, TG_TAO_DH: '2026-05-12T09:00:00', TRANG_THAI: 1 },
                { MA_DH: 4, TEN_TK: 'customer_d', TEN_SK: 'Kịch Tấm Cám', TONG_TIEN_BAN_DAU: 500000.00, SO_TIEN_DUOC_GIAM: 0.00, TONG_TIEN_CON_LAI: 500000.00, TG_TAO_DH: '2026-05-13T15:00:00', TRANG_THAI: 1 },
                { MA_DH: 5, TEN_TK: 'customer_c', TEN_SK: 'Show của Đen', TONG_TIEN_BAN_DAU: 2000000.00, SO_TIEN_DUOC_GIAM: 0.00, TONG_TIEN_CON_LAI: 2000000.00, TG_TAO_DH: '2026-05-14T21:10:00', TRANG_THAI: 0 },
                { MA_DH: 6, TEN_TK: 'customer_a', TEN_SK: 'Tech Summit 2026', TONG_TIEN_BAN_DAU: 1000000.00, SO_TIEN_DUOC_GIAM: 60000.00, TONG_TIEN_CON_LAI: 940000.00, TG_TAO_DH: '2026-05-14T08:00:00', TRANG_THAI: 1 },
                { MA_DH: 7, TEN_TK: 'customer_b', TEN_SK: 'See Sing Share Concert', TONG_TIEN_BAN_DAU: 4000000.00, SO_TIEN_DUOC_GIAM: 100000.00, TONG_TIEN_CON_LAI: 3900000.00, TG_TAO_DH: '2026-05-02T10:00:00', TRANG_THAI: 1 },
                { MA_DH: 8, TEN_TK: 'vip_user1', TEN_SK: 'See Sing Share Concert', TONG_TIEN_BAN_DAU: 8000000.00, SO_TIEN_DUOC_GIAM: 0.00, TONG_TIEN_CON_LAI: 8000000.00, TG_TAO_DH: '2026-05-03T10:00:00', TRANG_THAI: 1 }
            ];
        }
        currentPage = 1;
        renderOrderTable();
    }

    function renderOrderTable() {
        const tbody = document.getElementById('order-table-body');
        if (!tbody) return;
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = currentOrderData.slice(startIndex, startIndex + rowsPerPage);

        pageData.forEach(dh => {
            const tr = document.createElement('tr');

            // Mã ĐH
            const tdId = document.createElement('td');
            tdId.classList.add('col-id');
            const strongId = document.createElement('strong');
            strongId.textContent = `DH${dh.MA_DH.toString().padStart(4, '0')}`;
            tdId.appendChild(strongId);

            // Khách hàng
            const tdCustomer = document.createElement('td');
            tdCustomer.textContent = dh.TEN_TK;

            // Sự kiện
            const tdEvent = document.createElement('td');
            tdEvent.textContent = dh.TEN_SK;

            // Ngày đặt
            const tdDate = document.createElement('td');
            const dateObj = new Date(dh.TG_TAO_DH);
            tdDate.textContent = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} - ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

            // Tổng tiền
            const tdTotal = document.createElement('td');
            tdTotal.style.fontWeight = 'bold';
            tdTotal.style.color = '#28a745';
            tdTotal.textContent = `${parseInt(dh.TONG_TIEN_CON_LAI).toLocaleString()} đ`;

            // Trạng thái
            const tdStatus = document.createElement('td');
            tdStatus.style.textAlign = 'center';
            const statusSpan = document.createElement('span');
            statusSpan.style.cssText = "padding: 4px 10px; border-radius: 12px; font-size: 12px; color: white; font-weight: bold;";
            if (dh.TRANG_THAI === 1) {
                statusSpan.style.background = '#28a745';
                statusSpan.textContent = 'Đã thanh toán';
            } else {
                statusSpan.style.background = '#f39c12';
                statusSpan.textContent = 'Chờ thanh toán';
            }
            tdStatus.appendChild(statusSpan);

            // Thao tác
            const tdActions = document.createElement('td');
            tdActions.classList.add('actions', 'col-actions');

            const iconView = document.createElement('img');
            // Dùng tạm icon con mắt hoặc icon ticket của bạn để xem chi tiết
            iconView.src = '../img/ticket.png'; 
            iconView.title = 'Xem chi tiết đơn hàng';
            iconView.classList.add('action-icon');
            iconView.addEventListener('click', () => openOrderModal(dh));

            tdActions.append(iconView);
            tr.append(tdId, tdCustomer, tdEvent, tdDate, tdTotal, tdStatus, tdActions);
            tbody.appendChild(tr);
        });

        // Độn hàng cho đủ 10 dòng
        for (let i = 0; i < (rowsPerPage - pageData.length); i++) {
            const emptyTr = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const td = document.createElement('td');
                if (j === 0) td.textContent = '\u00A0';
                emptyTr.appendChild(td);
            }
            tbody.appendChild(emptyTr);
        }
        renderOrderPagination();
    }

    function renderOrderPagination() {
        const paginationContainer = document.getElementById('order-pagination');
        if (!paginationContainer) return;
        paginationContainer.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(currentOrderData.length / rowsPerPage));
        const prevSpan = document.createElement('span');
        prevSpan.textContent = '<';
        prevSpan.onclick = () => { if (currentPage > 1) { currentPage--; renderOrderTable(); } };
        paginationContainer.appendChild(prevSpan);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentPage) pageSpan.classList.add('active');
            pageSpan.onclick = () => { currentPage = i; renderOrderTable(); };
            paginationContainer.appendChild(pageSpan);
        }

        const nextSpan = document.createElement('span');
        nextSpan.textContent = '>';
        nextSpan.onclick = () => { if (currentPage < totalPages) { currentPage++; renderOrderTable(); } };
        paginationContainer.appendChild(nextSpan);
    }

    function setupOrderModal() {
        const modal = document.getElementById('order-modal');
        const closeBtn = document.getElementById('close-order-modal');
        const cancelBtn = document.getElementById('cancel-order-btn');

        if (!modal) return;

        const closeModal = () => {
            modal.style.display = 'none';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function openOrderModal(order) {
        const modal = document.getElementById('order-modal');
        const updateBtn = document.getElementById('save-order-btn');
        
        // Đổ dữ liệu vào DOM
        document.getElementById('detail-ma-dh').textContent = `DH${order.MA_DH.toString().padStart(4, '0')}`;
        
        const dateObj = new Date(order.TG_TAO_DH);
        document.getElementById('detail-ngay-dat').textContent = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
        
        document.getElementById('detail-khach-hang').textContent = order.TEN_TK;
        document.getElementById('detail-su-kien').textContent = order.TEN_SK;
        
        document.getElementById('detail-tong-ban-dau').textContent = `${parseInt(order.TONG_TIEN_BAN_DAU).toLocaleString()} đ`;
        document.getElementById('detail-giam-gia').textContent = `- ${parseInt(order.SO_TIEN_DUOC_GIAM).toLocaleString()} đ`;
        document.getElementById('detail-thanh-tien').textContent = `${parseInt(order.TONG_TIEN_CON_LAI).toLocaleString()} đ`;
        
        const statusEl = document.getElementById('detail-trang-thai');
        if (order.TRANG_THAI === 1) {
            statusEl.style.background = '#28a745';
            statusEl.textContent = '✅ Đã thanh toán';
            updateBtn.style.display = 'none'; // Không cần nút xác nhận nếu đã thanh toán
        } else {
            statusEl.style.background = '#f39c12';
            statusEl.textContent = '⏳ Chờ thanh toán';
            updateBtn.style.display = 'block'; // Hiện nút để Admin cập nhật thủ công (VD: Khách chuyển khoản ngân hàng)
        }

        modal.style.display = 'flex';
    }

    init();
})();