(() => {
    let currentCustomerData = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    function init() {
        loadCustomerDataFromAPI();
        setupCustomerModal();
    }

    async function loadCustomerDataFromAPI() {
        try {
            // Giả định API endpoint
            const response = await fetch('http://localhost:8000/api/khach-hang');
            if (!response.ok) throw new Error("Lỗi API Khách hàng");
            currentCustomerData = await response.json();
        } catch (error) {
            console.warn("Sử dụng dữ liệu giả định từ SQL Dump (Bảng tai_khoan + nguoi_dung):", error);
            // Dữ liệu mẫu kết hợp từ SQL Dump cho khách hàng (MA_NQ = 4 hoặc 5)
            currentCustomerData = [
                { MA_TK: 3, TEN_TK: 'customer_a', HO: 'Trần', TEN: 'Khách A', EMAIL: 'a@gmail.com', SDT: '0903333333', TRANG_THAI: 1, MA_NQ: 4 },
                { MA_TK: 4, TEN_TK: 'customer_b', HO: 'Phạm', TEN: 'Khách B', EMAIL: 'b@gmail.com', SDT: '0904444444', TRANG_THAI: 1, MA_NQ: 4 },
                { MA_TK: 5, TEN_TK: 'vip_user1', HO: 'Vũ', TEN: 'VIP C', EMAIL: 'vip@gmail.com', SDT: '0905555555', TRANG_THAI: 1, MA_NQ: 5 },
                { MA_TK: 8, TEN_TK: 'customer_c', HO: 'Ngô', TEN: 'Khách C', EMAIL: 'c@gmail.com', SDT: '0908888888', TRANG_THAI: 1, MA_NQ: 4 },
                { MA_TK: 10, TEN_TK: 'customer_d', HO: 'Đặng', TEN: 'Khách D', EMAIL: 'd@gmail.com', SDT: '0910000000', TRANG_THAI: 1, MA_NQ: 4 }
            ];
        }
        currentPage = 1;
        renderCustomerTable();
    }

    function renderCustomerTable() {
        const tbody = document.getElementById('customer-table-body');
        if (!tbody) return;
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = currentCustomerData.slice(startIndex, startIndex + rowsPerPage);

        pageData.forEach(kh => {
            const tr = document.createElement('tr');

            // Mã KH
            const tdId = document.createElement('td');
            tdId.classList.add('col-id');
            const strongId = document.createElement('strong');
            strongId.textContent = `KH${kh.MA_TK.toString().padStart(3, '0')}`;
            tdId.appendChild(strongId);

            // Tên tài khoản (Kèm tag VIP nếu có)
            const tdUsername = document.createElement('td');
            tdUsername.textContent = kh.TEN_TK + " ";
            if (kh.MA_NQ === 5) { // VIP Customer
                const vipTag = document.createElement('span');
                vipTag.textContent = 'VIP';
                vipTag.style.cssText = "background: #f1c40f; color: #000; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-left: 5px;";
                tdUsername.appendChild(vipTag);
            }

            // Họ và tên
            const tdName = document.createElement('td');
            tdName.textContent = `${kh.HO || ''} ${kh.TEN || ''}`.trim();

            // Email
            const tdEmail = document.createElement('td');
            tdEmail.textContent = kh.EMAIL || 'Chưa cập nhật';

            // SĐT
            const tdPhone = document.createElement('td');
            tdPhone.textContent = kh.SDT || 'Chưa cập nhật';

            // Trạng thái
            const tdStatus = document.createElement('td');
            tdStatus.style.textAlign = 'center';
            const statusSpan = document.createElement('span');
            statusSpan.style.cssText = "padding: 4px 10px; border-radius: 12px; font-size: 12px; color: white; font-weight: bold;";
            if (kh.TRANG_THAI === 1) {
                statusSpan.style.background = '#28a745';
                statusSpan.textContent = 'Hoạt động';
            } else {
                statusSpan.style.background = '#dc3545';
                statusSpan.textContent = 'Đã khóa';
            }
            tdStatus.appendChild(statusSpan);

            // Thao tác
            const tdActions = document.createElement('td');
            tdActions.classList.add('actions', 'col-actions');

            const iconView = document.createElement('img');
            iconView.src = '../img/edit.png'; // Thay bằng icon edit của bạn
            iconView.title = 'Xem / Cập nhật khách hàng';
            iconView.classList.add('action-icon');
            iconView.addEventListener('click', () => openCustomerModal(kh));

            tdActions.append(iconView);
            tr.append(tdId, tdUsername, tdName, tdEmail, tdPhone, tdStatus, tdActions);
            tbody.appendChild(tr);
        });

        // Độn hàng trống nếu chưa đủ
        for (let i = 0; i < (rowsPerPage - pageData.length); i++) {
            const emptyTr = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const td = document.createElement('td');
                if (j === 0) td.textContent = '\u00A0';
                emptyTr.appendChild(td);
            }
            tbody.appendChild(emptyTr);
        }
        renderCustomerPagination();
    }

    function renderCustomerPagination() {
        const paginationContainer = document.getElementById('customer-pagination');
        if (!paginationContainer) return;
        paginationContainer.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(currentCustomerData.length / rowsPerPage));
        const prevSpan = document.createElement('span');
        prevSpan.textContent = '<';
        prevSpan.onclick = () => { if (currentPage > 1) { currentPage--; renderCustomerTable(); } };
        paginationContainer.appendChild(prevSpan);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentPage) pageSpan.classList.add('active');
            pageSpan.onclick = () => { currentPage = i; renderCustomerTable(); };
            paginationContainer.appendChild(pageSpan);
        }

        const nextSpan = document.createElement('span');
        nextSpan.textContent = '>';
        nextSpan.onclick = () => { if (currentPage < totalPages) { currentPage++; renderCustomerTable(); } };
        paginationContainer.appendChild(nextSpan);
    }

    function setupCustomerModal() {
        const modal = document.getElementById('customer-modal');
        const closeBtn = document.getElementById('close-customer-modal');
        const cancelBtn = document.getElementById('cancel-customer-btn');

        if (!modal) return;

        const closeModal = () => {
            modal.style.display = 'none';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function openCustomerModal(customer) {
        const modal = document.getElementById('customer-modal');
        
        // Đổ dữ liệu vào DOM
        document.getElementById('detail-ma-kh').value = `KH${customer.MA_TK.toString().padStart(3, '0')}`;
        document.getElementById('detail-ten-tk').value = customer.TEN_TK;
        document.getElementById('detail-ho').value = customer.HO || '';
        document.getElementById('detail-ten').value = customer.TEN || '';
        document.getElementById('detail-email').value = customer.EMAIL || '';
        document.getElementById('detail-sdt').value = customer.SDT || '';
        document.getElementById('detail-trang-thai').value = customer.TRANG_THAI;

        modal.style.display = 'flex';
    }

    init();
})();