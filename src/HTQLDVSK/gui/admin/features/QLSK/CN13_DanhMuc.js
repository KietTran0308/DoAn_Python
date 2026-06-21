(() => {
    let currentCategoryData = [];
    let allCategoryData = [];
    let currentPage = 1;
    const rowsPerPage = 8;

    function init() {
        if (!window.hasPermission(13, 'THEM')) {
            const addBtn = document.getElementById('btn-open-add-category');
            if (addBtn) addBtn.style.display = 'none';
        }
        loadCategoryDataFromAPI();
        setupCategoryModal();
        setupSearch();
    }

    async function loadCategoryDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/danh-muc');
            if (!response.ok) throw new Error("Lỗi API");
            allCategoryData = await response.json();
        } catch (error) {
            console.error("Lỗi:", error);
            allCategoryData = [
                { MA_DMSK: 1, TEN_DM: 'Âm nhạc', IMAGE_URL: 'url/music.jpg', SO_LUONG_SK: 3 },
                { MA_DMSK: 2, TEN_DM: 'Thể thao', IMAGE_URL: 'url/sports.jpg', SO_LUONG_SK: 1 },
                { MA_DMSK: 3, TEN_DM: 'Hội thảo Công nghệ', IMAGE_URL: 'url/tech.jpg', SO_LUONG_SK: 1 }
            ];
        }
        currentCategoryData = [...allCategoryData];
        currentPage = 1;
        renderCategoryGrid();
    }

    function renderCategoryGrid() {
        const container = document.getElementById('category-grid-container');
        if (!container) return;

        container.replaceChildren();

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageData = currentCategoryData.slice(startIndex, startIndex + rowsPerPage);

        if (pageData.length === 0) {
            container.innerHTML = `<div style="grid-column: span 4; text-align: center; color: #888; margin-top: 50px; font-size: 18px;">Không tìm thấy danh mục nào.</div>`;
            renderPagination();
            return;
        }

        pageData.forEach(dm => {
            const card = document.createElement('div');
            let actionIcons = '';
            if (window.hasPermission(13, 'SUA')) actionIcons += `<img src="/img/EDIT.png" alt="Sửa" title="Chỉnh sửa danh mục" style="width: 30px; height: 30px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">`;
            if (window.hasPermission(13, 'XOA')) actionIcons += `<img src="/img/DELETE.png" alt="Xóa" title="Xóa danh mục" style="width: 30px; height: 30px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">`;

            const imgUrl = (dm.IMAGE_URL)
                ? dm.IMAGE_URL
                : `https://placehold.co/400x200/262532/7CCDFF?text=${encodeURIComponent(dm.TEN_DM)}`;

            card.style.cssText = `
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
                border: 1px solid #eee;
            `;

            card.onmouseenter = () => {
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)';
                card.style.borderColor = '#7CCDFF';
            };
            card.onmouseleave = () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                card.style.borderColor = '#eee';
            };

            card.innerHTML = `
                <div style="height: 200px; width: 100%; background-image: url('${imgUrl}'); background-size: cover; background-position: center; border-bottom: 3px solid #7CCDFF;">
                </div>
            
                <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #262532; font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${dm.TEN_DM}">
                    ${dm.TEN_DM}</h3>
                    <p style="margin: 0 0 20px 0; color: #666; font-size: 14px; display: flex; align-items: center; gap: 5px;">
                    Đang có: <b style="color: #1dd1a1; font-size: 16px;">${dm.SO_LUONG_SK || 0}</b> sự kiện</p>
                
                    <div style="margin-top: auto; display: flex; justify-content: flex-end; gap: 15px; border-top: 1px dashed #ddd; padding-top: 15px;">
                    ${actionIcons}
                </div>
            </div>
            `;
            card.addEventListener('click', (e) => {
                // Nếu người dùng bấm vào icon Sửa/Xóa thì KHÔNG chuyển trang
                if (e.target.tagName.toLowerCase() === 'img') return;

                // 1. Lưu từ khóa Danh mục vào SessionStorage
                sessionStorage.setItem('pendingCategoryFilter', dm.TEN_DM);

                // 2. Chuyển sang Tab Sự kiện (Mã 11) bằng hàm global của Admin.js
                if (typeof window.loadTabContent === 'function') {
                    window.loadTabContent(11);

                    // Đổi trạng thái hiển thị của thanh Tab ngang trên cùng
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active-tab'));
                    const tabs = document.querySelectorAll('.tab');
                    for (let t of tabs) {
                        if (t.textContent.toLowerCase().includes('sự kiện')) {
                            t.classList.add('active-tab');
                            break;
                        }
                    }
                }

                // 3. Kích hoạt Event (Dành cho trường hợp tab Sự kiện đã tải từ trước và đang ẩn)
                document.dispatchEvent(new CustomEvent('trigger-category-filter', { detail: dm.TEN_DM }));
            });
            container.appendChild(card);
        });

        renderPagination();
    }

    function renderPagination() {
        const paginationContainer = document.getElementById('category-pagination');
        if (!paginationContainer) return;

        const totalPages = Math.max(1, Math.ceil(currentCategoryData.length / rowsPerPage));
        paginationContainer.setAttribute('total-pages', totalPages);
        paginationContainer.setAttribute('current-page', currentPage);
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

    function setupSearch() {
        document.addEventListener('search-changed', (e) => {
            const keyword = e.detail.value.toLowerCase().trim();

            if (!keyword) {
                currentCategoryData = [...allCategoryData];
            } else {
                currentCategoryData = allCategoryData.filter(dm =>
                    (dm.TEN_DM && dm.TEN_DM.toLowerCase().includes(keyword)) ||
                    (dm.MA_DMSK && dm.MA_DMSK.toString().includes(keyword))
                );
            }
            currentPage = 1;
            renderCategoryGrid();
        });
        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'category-pagination') {
                currentPage = e.detail.page;
                renderCategoryGrid();
            }
        });
    }

    init();
})();