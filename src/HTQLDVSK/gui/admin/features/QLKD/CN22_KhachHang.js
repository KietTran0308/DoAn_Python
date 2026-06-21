(() => {
    let allCustomerData = [];     // Lưu dữ liệu gốc từ API
    let currentCustomerData = []; // Lưu dữ liệu sau khi lọc
    let currentPage = 1;
    const rowsPerPage = 10;

    let currentSearchKeyword = '';

    function init() {
        loadCustomerDataFromAPI();
        setupCustomerModal();
        setupSearchAndFilter();
        setupExportExcel();
    }

    async function loadCustomerDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/khach-hang');
            if (!response.ok) throw new Error("Lỗi API Khách hàng");
            allCustomerData = await response.json();
        } catch (error) {
            console.warn("Sử dụng dữ liệu giả định từ SQL Dump:", error);
        }
        currentCustomerData = [...allCustomerData];
        currentPage = 1;
        renderCustomerTable();
    }

    function renderCustomerTable() {
        const tbody = document.getElementById('customer-table-body');
        if (!tbody) return;
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = currentCustomerData.slice(startIndex, startIndex + rowsPerPage);

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #888;">Không tìm thấy khách hàng nào.</td></tr>`;
            renderCustomerPagination();
            return;
        }

        pageData.forEach(customer => {
            const tr = document.createElement('tr');

            const hoTen = `${customer.HO || ''} ${customer.TEN || ''}`.trim();

            // Xử lý huy hiệu Trạng thái
            const statusHtml = parseInt(customer.TRANG_THAI) === 1
                ? `<span style="background-color: #e0f7fa; color: #28a745; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: bold;">Hoạt động</span>`
                : `<span style="background-color: #f8d7da; color: #dc3545; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: bold;">Đã khóa</span>`;

            // Xử lý huy hiệu Hạng khách (4: Thường, 5: VIP)
            const roleHtml = parseInt(customer.MA_NQ) === 5
                ? `<span style="color: #f39c12; font-weight: bold;">VIP</span>`
                : `<span style="color: #6c757d;">Guest</span>`;

            tr.innerHTML = `
                <td><b>KH${customer.MA_TK.toString().padStart(3, '0')}</b></td>
                <td style="color: #0984e3; font-weight: bold;">@${customer.TEN_TK}</td>
                <td>${hoTen}</td>
                <td>${customer.EMAIL || '-'}</td>
                <td>${customer.SDT || '-'}</td>
                <td style="text-align: center;">${roleHtml}</td>
                <td style="text-align: center;">${statusHtml}</td>
                <td class="actions">
                    <img src="/img/EDIT.png" alt="Sửa" class="action-icon" title="Cập nhật tài khoản">
                </td>
            `;

            const editIcon = tr.querySelector('img[alt="Sửa"]');
            editIcon.addEventListener('click', () => openCustomerModal(customer));

            tbody.appendChild(tr);
        });

        renderCustomerPagination();
    }

    function renderCustomerPagination() {
        const paginationContainer = document.getElementById('customer-pagination');
        if (!paginationContainer) return;

        const totalPages = Math.max(1, Math.ceil(currentCustomerData.length / rowsPerPage));
        paginationContainer.setAttribute('total-pages', totalPages);
        paginationContainer.setAttribute('current-page', currentPage);
    }

    // ==========================================
    // TÌM KIẾM VÀ LỌC TRẠNG THÁI / HẠNG KHÁCH
    // ==========================================
    function setupSearchAndFilter() {
        const filterStatus = document.getElementById('filter-status-customer');
        const filterRole = document.getElementById('filter-role-customer');

        function applyAllFilters() {
            const statusVal = filterStatus ? filterStatus.value : '';
            const roleVal = filterRole ? filterRole.value : '';

            currentCustomerData = allCustomerData.filter(cus => {
                const hoTen = `${cus.HO || ''} ${cus.TEN || ''}`.toLowerCase();

                // Lọc theo từ khóa
                let matchKeyword = true;
                if (currentSearchKeyword) {
                    matchKeyword =
                        hoTen.includes(currentSearchKeyword) ||
                        (cus.TEN_TK && cus.TEN_TK.toLowerCase().includes(currentSearchKeyword)) ||
                        (cus.EMAIL && cus.EMAIL.toLowerCase().includes(currentSearchKeyword)) ||
                        (cus.SDT && cus.SDT.includes(currentSearchKeyword));
                }

                // Lọc theo trạng thái
                let matchStatus = true;
                if (statusVal !== '') matchStatus = (cus.TRANG_THAI.toString() === statusVal);

                // Lọc theo hạng khách (MA_NQ)
                let matchRole = true;
                if (roleVal !== '') matchRole = (cus.MA_NQ.toString() === roleVal);

                return matchKeyword && matchStatus && matchRole;
            });

            currentPage = 1;
            renderCustomerTable();
        }

        // Bắt sự kiện Web Component
        document.addEventListener('search-changed', (e) => {
            currentSearchKeyword = e.detail.value.toLowerCase().trim();
            applyAllFilters();
        });

        if (filterStatus) filterStatus.addEventListener('change', applyAllFilters);
        if (filterRole) filterRole.addEventListener('change', applyAllFilters);

        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'customer-pagination') {
                currentPage = e.detail.page;
                renderCustomerTable();
            }
        });
    }

    // ==========================================
    // MODAL VÀ LƯU DỮ LIỆU
    // ==========================================
    function setupCustomerModal() {
        const modal = document.getElementById('customer-modal');
        const closeBtn = document.getElementById('close-customer-modal');
        const cancelBtn = document.getElementById('cancel-customer-btn');

        if (!modal) return;
        const closeModal = () => { modal.style.display = 'none'; };
        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function openCustomerModal(customer) {
        const modal = document.getElementById('customer-modal');

        // 1. NẠP DỮ LIỆU SIDEBAR BÊN TRÁI (AVATAR & THÔNG TIN CHUNG)
        const hoTen = `${customer.HO || ''} ${customer.TEN || ''}`.trim() || 'Khách hàng ẩn danh';
        document.getElementById('detail-display-name').textContent = hoTen;
        document.getElementById('detail-username-badge').textContent = `@${customer.TEN_TK}`;

        // Tự động tạo Avatar xịn xò nếu Database bị thiếu link ảnh
        const avatarUrl = (customer.AVATAR_URL && !customer.AVATAR_URL.includes('url/'))
            ? customer.AVATAR_URL
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=7CCDFF&color=100F1A&bold=true&size=128`;
        document.getElementById('detail-avatar').src = avatarUrl;

        // Giả lập Dữ liệu thống kê mua hàng (Do API chưa có bảng tổng hợp)
        const mockOrders = Math.floor(Math.random() * 15) + 1; // Random 1 -> 15 đơn
        const mockSpent = mockOrders * 1250000;
        document.getElementById('detail-total-orders').textContent = `${mockOrders} đơn`;
        document.getElementById('detail-total-spent').textContent = `${mockSpent.toLocaleString('vi-VN')} đ`;

        // 2. NẠP DỮ LIỆU VÀO FORM CỘT PHẢI
        document.getElementById('detail-ma-kh').value = `KH${customer.MA_TK.toString().padStart(3, '0')}`;
        document.getElementById('detail-ho').value = customer.HO || '';
        document.getElementById('detail-ten').value = customer.TEN || '';
        document.getElementById('detail-email').value = customer.EMAIL || 'Chưa cập nhật';
        document.getElementById('detail-sdt').value = customer.SDT || 'Chưa cập nhật';

        // Set quyền và Trạng thái
        document.getElementById('detail-trang-thai').value = customer.TRANG_THAI;
        const detailRole = document.getElementById('detail-ma-nq');
        if(detailRole) detailRole.value = customer.MA_NQ || 4;

        // 3. XỬ LÝ SỰ KIỆN LƯU THAY ĐỔI
        const saveBtn = document.getElementById('save-customer-btn');
        saveBtn.onclick = () => {
            const newStatus = document.getElementById('detail-trang-thai').value;
            const newRole = document.getElementById('detail-ma-nq').value;

            // Lệnh giả lập cập nhật vào mảng hiện tại (Sẽ gọi API PUT tại đây khi có Backend)
            customer.TRANG_THAI = parseInt(newStatus);
            customer.MA_NQ = parseInt(newRole);

            window.Toast.success(`Đã cập nhật trạng thái cho tài khoản @${customer.TEN_TK}!`);
            modal.style.display = 'none';

            // Vẽ lại bảng dữ liệu bên ngoài
            renderCustomerTable();
        };

        modal.style.display = 'flex';
    }

    // ==========================================
    // XUẤT EXCEL (CSV)
    // ==========================================
    function setupExportExcel() {
        const btnExport = document.getElementById('btn-export-customers');
        if (btnExport) btnExport.addEventListener('click', exportToExcel);
    }

    function exportToExcel() {
        if (currentCustomerData.length === 0) {
            window.Toast.warning("Không có dữ liệu khách hàng nào để xuất!");
            return;
        }

        let csvContent = "\uFEFF";
        csvContent += "Mã KH,Tên tài khoản,Họ và tên,Email,Số điện thoại,Hạng khách,Trạng thái\n";

        currentCustomerData.forEach(cus => {
            const maKH = `KH${cus.MA_TK.toString().padStart(3, '0')}`;
            const tk = `@${cus.TEN_TK}`;
            const hoTen = `"${cus.HO || ''} ${cus.TEN || ''}"`.trim();
            const email = cus.EMAIL || '';
            const sdt = cus.SDT || '';
            const hang = parseInt(cus.MA_NQ) === 5 ? "Khách VIP" : "Khách thường";
            const trangThai = parseInt(cus.TRANG_THAI) === 1 ? "Hoạt động" : "Đã khóa";

            csvContent += `${maKH},${tk},${hoTen},${email},${sdt},${hang},${trangThai}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Danh_Sach_Khach_Hang.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    init();
})();