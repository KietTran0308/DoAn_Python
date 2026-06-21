(() => {
    let allPromoData = [];
    let currentPromoData = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    let currentSearchKeyword = '';

    function init() {
        loadPromoDataFromAPI();
        setupPromoModal();
        setupDynamicFormLogic();
        setupSearchAndFilter();
    }

    // Hàm tiện ích định dạng tiền tệ
    function formatVND(amount) {
        return parseInt(amount).toLocaleString('vi-VN') + ' đ';
    }

    // Hàm tiện ích định dạng ngày tháng
    function formatDateStr(dateStr) {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    async function loadPromoDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/khuyen-mai');
            if (!response.ok) throw new Error("Lỗi API Khuyến mãi");
            allPromoData = await response.json();
        } catch (error) {
            console.warn("Dùng dữ liệu SQL Mockup:", error);
        }
        currentPromoData = [...allPromoData]; // Thêm dòng này
        currentPage = 1;
        renderPromoTable();
    }

    function renderPromoTable() {
        const tbody = document.getElementById('promo-table-body');
        if (!tbody) return;
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = currentPromoData.slice(startIndex, startIndex + rowsPerPage);

        pageData.forEach(km => {
            const tr = document.createElement('tr');

            // Mã Code
            const tdCode = document.createElement('td');
            tdCode.classList.add('col-id');
            const strongCode = document.createElement('strong');
            strongCode.textContent = km.CODE;
            tdCode.appendChild(strongCode);

            // Loại giảm
            const tdType = document.createElement('td');
            const typeSpan = document.createElement('span');
            typeSpan.style.cssText = "padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white;";
            if (km.LOAI_GIAM === 'PERCENT') {
                typeSpan.style.background = '#8e44ad';
                typeSpan.textContent = 'Phần trăm';
            } else {
                typeSpan.style.background = '#27ae60';
                typeSpan.textContent = 'Số tiền';
            }
            tdType.appendChild(typeSpan);

            // Mức giảm
            const tdValue = document.createElement('td');
            tdValue.style.fontWeight = 'bold';
            tdValue.style.color = '#e74c3c';
            tdValue.textContent = km.LOAI_GIAM === 'PERCENT' ? `${parseInt(km.GIA_TRI_GIAM)}%` : formatVND(km.GIA_TRI_GIAM);

            // Đơn tối thiểu
            const tdCondition = document.createElement('td');
            tdCondition.textContent = km.DIEU_KIEN > 0 ? `Từ ${formatVND(km.DIEU_KIEN)}` : 'Không giới hạn';

            // Thời hạn
            const tdDate = document.createElement('td');
            tdDate.textContent = `${formatDateStr(km.TG_BAT_DAU)} - ${formatDateStr(km.TG_KET_THUC)}`;

            // Giới hạn
            const tdLimit = document.createElement('td');
            tdLimit.style.textAlign = 'center';
            tdLimit.textContent = km.GIOI_HAN;

            // Thao tác
            const tdActions = document.createElement('td');
            tdActions.classList.add('actions', 'col-actions');

            const iconEdit = document.createElement('img');
            iconEdit.src = '/img/EDIT.png';
            iconEdit.title = 'Sửa Khuyến Mãi';
            iconEdit.classList.add('action-icon');
            iconEdit.addEventListener('click', () => openPromoModal(km));

            const iconHistory = document.createElement('img');
            iconHistory.src = '/img/HISTORY.png';
            iconHistory.title = 'Lịch sử sử dụng';
            iconHistory.classList.add('action-icon');
            iconHistory.addEventListener('click', () => openPromoHistoryModal(km))

            tdActions.append(iconEdit);
            tdActions.append(iconHistory);

            tr.append(tdCode, tdType, tdValue, tdCondition, tdDate, tdLimit, tdActions);
            tbody.appendChild(tr);
        });

        // Độn hàng
        for (let i = 0; i < (rowsPerPage - pageData.length); i++) {
            const emptyTr = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const td = document.createElement('td');
                if (j === 0) td.textContent = '\u00A0';
                emptyTr.appendChild(td);
            }
            tbody.appendChild(emptyTr);
        }
        renderPromoPagination();
    }

    function renderPromoPagination() {
        const paginationContainer = document.getElementById('promo-pagination');
        if (!paginationContainer) return;
        paginationContainer.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(currentPromoData.length / rowsPerPage));
        const prevSpan = document.createElement('span');
        prevSpan.textContent = '<';
        prevSpan.onclick = () => { if (currentPage > 1) { currentPage--; renderPromoTable(); } };
        paginationContainer.appendChild(prevSpan);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentPage) pageSpan.classList.add('active');
            pageSpan.onclick = () => { currentPage = i; renderPromoTable(); };
            paginationContainer.appendChild(pageSpan);
        }

        const nextSpan = document.createElement('span');
        nextSpan.textContent = '>';
        nextSpan.onclick = () => { if (currentPage < totalPages) { currentPage++; renderPromoTable(); } };
        paginationContainer.appendChild(nextSpan);
    }

    function setupPromoModal() {
        const addBtn = document.getElementById('btn-open-add-promo');
        const modal = document.getElementById('promo-modal');
        const closeBtn = document.getElementById('close-promo-modal');
        const cancelBtn = document.getElementById('cancel-promo-btn');

        if (!modal || !addBtn) return;

        addBtn.addEventListener('click', () => openPromoModal(null));

        const closeModal = () => {
            modal.style.display = 'none';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function setupDynamicFormLogic() {
        const typeSelect = document.getElementById('LOAI_GIAM');
        const maxDiscountInput = document.getElementById('GIAM_TOI_DA');
        
        if(typeSelect && maxDiscountInput) {
            typeSelect.addEventListener('change', (e) => {
                if(e.target.value === 'AMOUNT') {
                    maxDiscountInput.value = '';
                    maxDiscountInput.disabled = true;
                    maxDiscountInput.style.backgroundColor = '#e9ecef';
                    maxDiscountInput.placeholder = "Không áp dụng";
                } else {
                    maxDiscountInput.disabled = false;
                    maxDiscountInput.style.backgroundColor = '#fff';
                    maxDiscountInput.placeholder = "VD: 50000";
                }
            });
        }
    }

    function openPromoModal(promo) {
        const modal = document.getElementById('promo-modal');
        const form = document.getElementById('promoForm');
        const title = document.getElementById('promo-modal-title');
        const deleteBtn = document.getElementById('delete-promo-btn');
        const typeSelect = document.getElementById('LOAI_GIAM');

        if (form) form.reset();

        if (promo) {
            title.textContent = "Cập nhật Mã Khuyến Mãi";
            document.getElementById('MA_GG').value = promo.MA_GG;
            document.getElementById('CODE').value = promo.CODE;
            document.getElementById('GIOI_HAN').value = promo.GIOI_HAN;
            document.getElementById('LOAI_GIAM').value = promo.LOAI_GIAM;
            document.getElementById('GIA_TRI_GIAM').value = parseInt(promo.GIA_TRI_GIAM);
            document.getElementById('DIEU_KIEN').value = parseInt(promo.DIEU_KIEN);
            document.getElementById('GIAM_TOI_DA').value = parseInt(promo.GIAM_TOI_DA) || '';
            document.getElementById('TG_BAT_DAU').value = promo.TG_BAT_DAU.substring(0, 16);
            document.getElementById('TG_KET_THUC').value = promo.TG_KET_THUC.substring(0, 16);
            
            deleteBtn.style.display = 'block';
        } else {
            title.textContent = "Thêm Mã Khuyến Mãi";
            document.getElementById('MA_GG').value = "";
            deleteBtn.style.display = 'none';
        }

        // Kích hoạt thủ công event change để set trạng thái ô "Giảm tối đa"
        typeSelect.dispatchEvent(new Event('change'));
        modal.style.display = 'flex';
    }

    function setupSearchAndFilter() {
        const filterType = document.getElementById('filter-loai-giam');

        function applyAllFilters() {
            const typeVal = filterType ? filterType.value : '';

            currentPromoData = allPromoData.filter(promo => {
                let matchKeyword = true;
                if (currentSearchKeyword) {
                    matchKeyword = promo.CODE.toLowerCase().includes(currentSearchKeyword);
                }

                let matchType = true;
                if (typeVal !== '') {
                    matchType = (promo.LOAI_GIAM === typeVal);
                }

                return matchKeyword && matchType;
            });

            currentPage = 1;
            renderPromoTable();
        }

        // Bắt sự kiện Web Component
        document.addEventListener('search-changed', (e) => {
            currentSearchKeyword = e.detail.value.toLowerCase().trim();
            applyAllFilters();
        });

        if (filterType) filterType.addEventListener('change', applyAllFilters);

        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'promo-pagination') {
                currentPage = e.detail.page;
                renderPromoTable();
            }
        });
    }

    function openPromoHistoryModal(promo) {
        const modal = document.getElementById('promo-history-modal');
        document.getElementById('history-promo-code').textContent = promo.CODE;

        const closeBtn = document.getElementById('close-history-modal');
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

        const tbody = document.getElementById('promo-history-body');
        tbody.replaceChildren();

        // MOCKUP DATA: Lấy thông tin từ bảng don_hang dựa theo Database thực tế
        let mockHistory = [];
        if (promo.MA_GG === 1) mockHistory = [{ MA_DH: 2, TEN_TK: 'customer_b', NGAY: '2026-05-11T11:00:00', GIAM: 50000 }];
        else if (promo.MA_GG === 2) mockHistory = [{ MA_DH: 10, TEN_TK: 'customer_c', NGAY: '2026-06-02T10:00:00', GIAM: 100000 }];
        else if (promo.MA_GG === 3) mockHistory = [{ MA_DH: 3, TEN_TK: 'vip_user1', NGAY: '2026-05-12T09:00:00', GIAM: 500000 }];
        else if (promo.MA_GG === 8) mockHistory = [{ MA_DH: 7, TEN_TK: 'customer_b', NGAY: '2026-05-02T10:00:00', GIAM: 100000 }];
        else if (promo.MA_GG === 9) mockHistory = [{ MA_DH: 6, TEN_TK: 'customer_a', NGAY: '2026-05-14T08:00:00', GIAM: 60000 }];

        if (mockHistory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888; padding: 20px;">Mã này chưa được khách hàng nào sử dụng.</td></tr>`;
        } else {
            mockHistory.forEach(h => {
                const d = new Date(h.NGAY);
                const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #eee;"><b>ĐH${h.MA_DH.toString().padStart(5, '0')}</b></td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #0984e3; font-weight: 500;">@${h.TEN_TK}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #666;">${dateStr}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; text-align: right; color: #e74c3c; font-weight: bold;">- ${h.GIAM.toLocaleString('vi-VN')} đ</td>
                    </tr>
                `;
            });
        }

        modal.style.display = 'flex';
    }

    init();
})();