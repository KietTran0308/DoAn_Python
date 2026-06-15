(() => {
    let currentPromoData = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    function init() {
        loadPromoDataFromAPI();
        setupPromoModal();
        setupDynamicFormLogic();
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
            currentPromoData = await response.json();
        } catch (error) {
            console.warn("Dùng dữ liệu SQL Mockup:", error);
            // Lấy dữ liệu mockup từ SQL DUMP
            currentPromoData = [
                { MA_GG: 1, CODE: 'WELCOME50', LOAI_GIAM: 'PERCENT', GIA_TRI_GIAM: 50.00, DIEU_KIEN: 0.00, TG_BAT_DAU: '2026-01-01T00:00:00', TG_KET_THUC: '2026-12-31T00:00:00', GIAM_TOI_DA: 50000.00, GIOI_HAN: 100 },
                { MA_GG: 2, CODE: 'SUMMER20', LOAI_GIAM: 'PERCENT', GIA_TRI_GIAM: 20.00, DIEU_KIEN: 100000.00, TG_BAT_DAU: '2026-06-01T00:00:00', TG_KET_THUC: '2026-08-31T00:00:00', GIAM_TOI_DA: 100000.00, GIOI_HAN: 500 },
                { MA_GG: 3, CODE: 'VIPMINUS500K', LOAI_GIAM: 'AMOUNT', GIA_TRI_GIAM: 500000.00, DIEU_KIEN: 2000000.00, TG_BAT_DAU: '2026-01-01T00:00:00', TG_KET_THUC: '2026-12-31T00:00:00', GIAM_TOI_DA: 500000.00, GIOI_HAN: 50 },
                { MA_GG: 4, CODE: 'HALLOWEEN', LOAI_GIAM: 'PERCENT', GIA_TRI_GIAM: 15.00, DIEU_KIEN: 0.00, TG_BAT_DAU: '2026-10-25T00:00:00', TG_KET_THUC: '2026-10-31T00:00:00', GIAM_TOI_DA: 30000.00, GIOI_HAN: 200 },
                { MA_GG: 6, CODE: 'TET2027', LOAI_GIAM: 'AMOUNT', GIA_TRI_GIAM: 100000.00, DIEU_KIEN: 500000.00, TG_BAT_DAU: '2026-12-01T00:00:00', TG_KET_THUC: '2027-01-31T00:00:00', GIAM_TOI_DA: 100000.00, GIOI_HAN: 300 },
                { MA_GG: 10, CODE: 'FREESHIP', LOAI_GIAM: 'AMOUNT', GIA_TRI_GIAM: 20000.00, DIEU_KIEN: 0.00, TG_BAT_DAU: '2026-01-01T00:00:00', TG_KET_THUC: '2026-12-31T00:00:00', GIAM_TOI_DA: 20000.00, GIOI_HAN: 9999 }
            ];
        }
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
            iconEdit.src = '../img/edit.png'; 
            iconEdit.title = 'Sửa Khuyến Mãi';
            iconEdit.classList.add('action-icon');
            iconEdit.addEventListener('click', () => openPromoModal(km));

            tdActions.append(iconEdit);
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

    init();
})();