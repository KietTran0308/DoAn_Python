(() => {
    let currentCategoryData = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    function init() {
        loadCategoryDataFromAPI();
        setupCategoryModal();
    }

    async function loadCategoryDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/danh-muc');
            if (!response.ok) throw new Error("Lỗi API");
            currentCategoryData = await response.json();
        } catch (error) {
            console.error("Lỗi:", error);
            // Fallback tĩnh (nếu API chưa chạy)
            currentCategoryData = [
                { MA_DMSK: 1, TEN_DM: 'Âm nhạc', IMAGE_URL: 'url/music.jpg', SO_LUONG_SK: 3 },
                { MA_DMSK: 2, TEN_DM: 'Thể thao', IMAGE_URL: 'url/sports.jpg', SO_LUONG_SK: 1 },
                { MA_DMSK: 3, TEN_DM: 'Hội thảo Công nghệ', IMAGE_URL: 'url/tech.jpg', SO_LUONG_SK: 1 }
            ];
        }
        currentPage = 1;
        renderCategoryTable();
    }

    function renderCategoryTable() {
        const tbody = document.getElementById('category-table-body');
        if (!tbody) return;
        tbody.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = currentCategoryData.slice(startIndex, startIndex + rowsPerPage);

        pageData.forEach(dm => {
            const tr = document.createElement('tr');

            // Mã DM
            const tdId = document.createElement('td');
            tdId.classList.add('col-id');
            const strongId = document.createElement('strong');
            strongId.textContent = `DM${dm.MA_DMSK.toString().padStart(3, '0')}`;
            tdId.appendChild(strongId);

            // Hình ảnh (Thumbnail)
            const tdImage = document.createElement('td');
            tdImage.style.textAlign = 'center';
            const img = document.createElement('img');
            // Dùng ảnh placeholder nếu URL không hợp lệ
            img.src = dm.IMAGE_URL.startsWith('http') ? dm.IMAGE_URL : 'https://via.placeholder.com/60x40?text=No+Image';
            img.style.cssText = "width: 60px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;";
            tdImage.appendChild(img);

            // Tên DM
            const tdName = document.createElement('td');
            tdName.textContent = dm.TEN_DM;

            // Số lượng sự kiện
            const tdCount = document.createElement('td');
            tdCount.style.textAlign = 'center';
            const badge = document.createElement('span');
            badge.style.cssText = "background: #6a95b8; color: white; padding: 4px 10px; border-radius: 12px; font-size: 14px; font-weight: bold;";
            badge.textContent = dm.SO_LUONG_SK;
            tdCount.appendChild(badge);

            // Thao tác
            const tdActions = document.createElement('td');
            tdActions.classList.add('actions', 'col-actions');

            const iconEdit = document.createElement('img');
            iconEdit.src = '../img/EDIT.png';
            iconEdit.classList.add('action-icon');

            const iconDelete = document.createElement('img');
            iconDelete.src = '../img/DELETE.png';
            iconDelete.classList.add('action-icon');

            tdActions.append(iconEdit, iconDelete);
            tr.append(tdId, tdImage, tdName, tdCount, tdActions);
            tbody.appendChild(tr);
        });

        // Độn hàng
        for (let i = 0; i < (rowsPerPage - pageData.length); i++) {
            const emptyTr = document.createElement('tr');
            for (let j = 0; j < 5; j++) {
                const td = document.createElement('td');
                if (j === 0) td.textContent = '\u00A0';
                emptyTr.appendChild(td);
            }
            tbody.appendChild(emptyTr);
        }
        renderCategoryPagination();
    }

    function renderCategoryPagination() {
        const paginationContainer = document.getElementById('category-pagination');
        if (!paginationContainer) return;
        paginationContainer.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(currentCategoryData.length / rowsPerPage));
        // Logic sinh nút phân trang... (Giống CN12)
        const prevSpan = document.createElement('span');
        prevSpan.textContent = '<';
        prevSpan.onclick = () => { if (currentPage > 1) { currentPage--; renderCategoryTable(); } };
        paginationContainer.appendChild(prevSpan);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentPage) pageSpan.classList.add('active');
            pageSpan.onclick = () => { currentPage = i; renderCategoryTable(); };
            paginationContainer.appendChild(pageSpan);
        }

        const nextSpan = document.createElement('span');
        nextSpan.textContent = '>';
        nextSpan.onclick = () => { if (currentPage < totalPages) { currentPage++; renderCategoryTable(); } };
        paginationContainer.appendChild(nextSpan);
    }

    function setupCategoryModal() {
        const addBtn = document.getElementById('btn-open-add-category');
        const modal = document.getElementById('category-modal');
        const closeBtn = document.getElementById('close-category-modal');
        const cancelBtn = document.getElementById('cancel-category-btn');

        if (!addBtn || !modal) return;

        addBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
        const closeModal = () => {
            modal.style.display = 'none';
            const form = document.getElementById('categoryForm');
            if (form) form.reset();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    init();
})();