(() => {
    let currentStaffData = [];
    let currentPage = 1;
    const cardsPerPage = 6; // Hiển thị 9 thẻ (3 cột x 3 hàng) mỗi trang
    let currentKeyword = "";

    function init() {
        if (!window.hasPermission(31, 'THEM')) {
            const addBtn = document.getElementById('btn-open-add-staff');
            if (addBtn) addBtn.style.display = 'none';
        }
        loadStaffDataFromAPI();
        setupStaffModal();
        setupFilters();
    }

    async function loadStaffDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/nhan-su');
            if (!response.ok) throw new Error("Lỗi API Nhân sự");
            currentStaffData = await response.json();
        } catch (error) {
            console.warn("Dùng dữ liệu SQL Mockup (bảng tai_khoan + nguoi_dung + nhom_quyen):", error);
            // Dữ liệu giả lập trích xuất từ SQL (Chỉ lấy Admin, Manager, Staff, Organizer - MA_NQ != 4,5)
            currentStaffData = [
                { MA_TK: 1, TEN_TK: 'admin_system', HO: 'Nguyễn', TEN: 'Quản Trị', EMAIL: 'admin@event.com', SDT: '0901111111', MA_NQ: 1, TEN_NQ: 'Admin', TRANG_THAI: 1, AVATAR_URL: 'url/av1.jpg' },
                { MA_TK: 2, TEN_TK: 'manager_01', HO: 'Lê', TEN: 'Quản Lý', EMAIL: 'manager@event.com', SDT: '0902222222', MA_NQ: 2, TEN_NQ: 'Manager', TRANG_THAI: 1, AVATAR_URL: 'url/av2.jpg' },
                { MA_TK: 6, TEN_TK: 'staff_soatve', HO: 'Hoàng', TEN: 'Nhân Viên 1', EMAIL: 'staff1@event.com', SDT: '0906666666', MA_NQ: 3, TEN_NQ: 'Staff', TRANG_THAI: 1, AVATAR_URL: 'url/av6.jpg' },
                { MA_TK: 7, TEN_TK: 'staff_soatve2', HO: 'Đỗ', TEN: 'Nhân Viên 2', EMAIL: 'staff2@event.com', SDT: '0907777777', MA_NQ: 3, TEN_NQ: 'Staff', TRANG_THAI: 1, AVATAR_URL: 'url/av7.jpg' },
                { MA_TK: 9, TEN_TK: 'organizer_x', HO: 'Bùi', TEN: 'Nhà Tổ Chức', EMAIL: 'org@event.com', SDT: '0909999999', MA_NQ: 7, TEN_NQ: 'Event Organizer', TRANG_THAI: 1, AVATAR_URL: 'url/av9.jpg' }
            ];
        }
        currentPage = 1;
        renderStaffGrid();
    }

    // Tiện ích lấy màu sắc dựa trên nhóm quyền
    function getRoleColor(maNq) {
        switch (maNq) {
            case 1: return { bg: '#ffeaea', text: '#e74c3c' }; // Admin: Đỏ
            case 2: return { bg: '#eef2ff', text: '#007bff' }; // Manager: Xanh dương
            case 3: return { bg: '#e9f7ef', text: '#28a745' }; // Staff: Xanh lá
            case 7: return { bg: '#fef5e7', text: '#f39c12' }; // Organizer: Cam
            default: return { bg: '#f4f4f4', text: '#6c757d' }; // Khác: Xám
        }
    }

    function renderStaffGrid() {
        const container = document.getElementById('staff-grid-container');
        if (!container) return;
        container.replaceChildren();

        const startIndex = (currentPage - 1) * cardsPerPage;
        const pageData = currentStaffData.slice(startIndex, startIndex + cardsPerPage);

        pageData.forEach(ns => {
            // Thẻ Card chính
            const card = document.createElement('div');
            card.style.cssText = "background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 20px; display: flex; flex-direction: column; gap: 15px; position: relative; transition: transform 0.2s;";
            card.onmouseenter = () => card.style.transform = "translateY(-5px)";
            card.onmouseleave = () => card.style.transform = "translateY(0)";

            // --- Phần Đầu: Avatar & Thông tin cơ bản ---
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = "display: flex; gap: 15px; align-items: center;";

            // Avatar
            const avatar = document.createElement('img');
            avatar.src = ns.AVATAR_URL && !ns.AVATAR_URL.startsWith('url/') ? ns.AVATAR_URL : '../img/default_avatar.png'; // Fallback nếu URL lỗi
            avatar.alt = ns.TEN_TK;
            avatar.style.cssText = "width: 60px; height: 60px; border-radius: 50%; object-fit: cover; background: #e9ecef; border: 2px solid #f4f7f6;";

            // Info block (Tên + Username)
            const infoBlock = document.createElement('div');
            infoBlock.style.flex = "1";

            const nameEl = document.createElement('h4');
            nameEl.textContent = `${ns.HO || ''} ${ns.TEN || ''}`.trim() || 'Chưa cập nhật';
            nameEl.style.cssText = "margin: 0 0 5px 0; font-size: 16px; color: #262532;";

            const usernameEl = document.createElement('p');
            usernameEl.textContent = `@${ns.TEN_TK}`;
            usernameEl.style.cssText = "margin: 0; font-size: 13px; color: #6c757d;";

            infoBlock.append(nameEl, usernameEl);
            headerDiv.append(avatar, infoBlock);

            // --- Nút Sửa (Edit) Góc phải ---
            const editBtn = document.createElement('button');
            editBtn.innerHTML = "✎";
            editBtn.title = "Cập nhật nhân sự";
            editBtn.style.cssText = "position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 18px; cursor: pointer; color: #007bff;";
            editBtn.onclick = () => openStaffModal(ns);

            // --- Phần Giữa: Badge Chức vụ & Trạng thái ---
            const badgeDiv = document.createElement('div');
            badgeDiv.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #eee; padding-bottom: 10px;";

            const roleColors = getRoleColor(ns.MA_NQ);
            const roleBadge = document.createElement('span');
            roleBadge.textContent = ns.TEN_NQ;
            roleBadge.style.cssText = `background: ${roleColors.bg}; color: ${roleColors.text}; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;`;

            const statusBadge = document.createElement('span');
            statusBadge.textContent = ns.TRANG_THAI === 1 ? 'Hoạt động' : 'Đã khóa';
            statusBadge.style.cssText = `font-size: 12px; font-weight: 600; color: ${ns.TRANG_THAI === 1 ? '#28a745' : '#dc3545'};`;

            badgeDiv.append(roleBadge, statusBadge);

            // --- Phần Cuối: Liên hệ ---
            const contactDiv = document.createElement('div');
            contactDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #555;";

            const emailEl = document.createElement('div');
            emailEl.innerHTML = `📧 <span>${ns.EMAIL || 'Chưa cập nhật email'}</span>`;

            const phoneEl = document.createElement('div');
            phoneEl.innerHTML = `📞 <span>${ns.SDT || 'Chưa cập nhật SĐT'}</span>`;

            contactDiv.append(emailEl, phoneEl);

            const dateDiv = document.createElement('div');
            dateDiv.style.cssText = "display: flex; flex-direction: column; gap: 5px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; font-size: 11px; color: #888;";

            const createdAtEl = document.createElement('span');
            createdAtEl.textContent = `🕒 Ngày tạo: ${ns.NGAY_TAO || 'Chưa cập nhật'}`;

            const lastLoginEl = document.createElement('span');
            lastLoginEl.textContent = `➡️ Đăng nhập cuối: ${ns.LAN_DANG_NHAP_CUOI || 'Chưa từng đăng nhập'}`;

            dateDiv.append(createdAtEl, lastLoginEl);
            contactDiv.append(dateDiv);

            // Gộp tất cả vào Card
            card.append(headerDiv, editBtn, badgeDiv, contactDiv);
            container.appendChild(card);
        });

        renderStaffPagination();
    }

    function renderStaffPagination() {
        const paginationContainer = document.getElementById('staff-pagination');
        if (!paginationContainer) return;
        paginationContainer.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(currentStaffData.length / cardsPerPage));

        const prevSpan = document.createElement('span');
        prevSpan.textContent = '<';
        prevSpan.onclick = () => { if (currentPage > 1) { currentPage--; renderStaffGrid(); } };
        paginationContainer.appendChild(prevSpan);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentPage) pageSpan.classList.add('active');
            pageSpan.onclick = () => { currentPage = i; renderStaffGrid(); };
            paginationContainer.appendChild(pageSpan);
        }

        const nextSpan = document.createElement('span');
        nextSpan.textContent = '>';
        nextSpan.onclick = () => { if (currentPage < totalPages) { currentPage++; renderStaffGrid(); } };
        paginationContainer.appendChild(nextSpan);
    }

    function setupStaffModal() {
        const addBtn = document.getElementById('btn-open-add-staff');
        const modal = document.getElementById('staff-modal');
        const closeBtn = document.getElementById('close-staff-modal');
        const cancelBtn = document.getElementById('cancel-staff-btn');

        if (!addBtn || !modal) return;

        addBtn.addEventListener('click', () => openStaffModal(null));

        const closeModal = () => {
            modal.style.display = 'none';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function openStaffModal(staff) {
        const modal = document.getElementById('staff-modal');
        const form = document.getElementById('staffForm');
        const title = document.getElementById('staff-modal-title');
        const deleteBtn = document.getElementById('delete-staff-btn');
        const pwdReq = document.getElementById('pwd-req');

        if (form) form.reset();

        if (staff) {
            title.textContent = "Cập nhật Thông tin Nhân sự";
            document.getElementById('MA_TK').value = staff.MA_TK;
            document.getElementById('TEN_TK').value = staff.TEN_TK;
            document.getElementById('TEN_TK').readOnly = true; // Không cho đổi username
            document.getElementById('TEN_TK').style.backgroundColor = '#e9ecef';

            document.getElementById('HO').value = staff.HO || '';
            document.getElementById('TEN').value = staff.TEN || '';
            document.getElementById('EMAIL').value = staff.EMAIL || '';
            document.getElementById('SDT').value = staff.SDT || '';
            document.getElementById('MA_NQ').value = staff.MA_NQ;
            document.getElementById('TRANG_THAI').value = staff.TRANG_THAI;
            document.getElementById('AVATAR_URL').value = staff.AVATAR_URL || '';

            pwdReq.style.display = 'none'; // Không bắt buộc nhập pass khi edit
            deleteBtn.style.display = 'block';

            document.getElementById('NGAY_TAO').value = staff.NGAY_TAO || 'N/A';
            document.getElementById('LAN_DANG_NHAP_CUOI').value = staff.LAN_DANG_NHAP_CUOI || 'N/A';

            pwdReq.style.display = 'none';
            deleteBtn.style.display = 'block';
        } else {
            title.textContent = "Thêm Nhân Sự Hệ Thống Mới";
            document.getElementById('MA_TK').value = "";
            document.getElementById('TEN_TK').readOnly = false;
            document.getElementById('TEN_TK').style.backgroundColor = '#fff';

            pwdReq.style.display = 'inline'; // Bắt buộc nhập pass khi tạo mới
            deleteBtn.style.display = 'none';

            document.getElementById('NGAY_TAO').value = 'Hệ thống tự động tạo';
            document.getElementById('LAN_DANG_NHAP_CUOI').value = 'Chưa có dữ liệu';

            pwdReq.style.display = 'inline';
            deleteBtn.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    function setupFilters() {
        const searchBox = document.getElementById('search-staff');
        const roleFilter = document.getElementById('filter-role');

        const applyFilters = () => {
            const roleId = roleFilter ? roleFilter.value : "";

            filteredStaffData = currentStaffData.filter(ns => {
                const fullName = `${ns.HO || ''} ${ns.TEN || ''}`.toLowerCase();
                const username = (ns.TEN_TK || '').toLowerCase();
                const email = (ns.EMAIL || '').toLowerCase();

                const matchKeyword = fullName.includes(currentKeyword) || username.includes(currentKeyword) || email.includes(currentKeyword);
                const matchRole = roleId === "" || ns.MA_NQ.toString() === roleId;

                return matchKeyword && matchRole;
            });

            currentPage = 1;
            renderStaffGrid();
        };

        // Lắng nghe CustomEvent 'search-changed' từ Web Component
        if (searchBox) {
            searchBox.addEventListener('search-changed', (e) => {
                currentKeyword = e.detail.value.toLowerCase().trim();
                applyFilters();
            });
        }

        if (roleFilter) roleFilter.addEventListener('change', applyFilters);
    }

    init();
})();