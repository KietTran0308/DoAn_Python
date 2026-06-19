(() => {
    let allArtistData = [];
    let currentArtistData = [];
    let currentPage = 1;
    const cardsPerPage = 18;

    function init() {
        loadArtistDataFromAPI();
        setupArtistModal();
        setupSearch();
    }

    async function loadArtistDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/nghe-si');
            if (!response.ok) throw new Error("Lỗi tải API nghệ sĩ");
            allArtistData = await response.json();
        } catch (error) {
            console.error("Dùng dữ liệu SQL giả định do API lỗi:", error);
        }
        currentArtistData = [...allArtistData];
        currentPage = 1;
        renderArtistGrid();
    }

    function renderArtistGrid() {
        const gridContainer = document.getElementById('artist-grid-container');
        if (!gridContainer) return;

        gridContainer.replaceChildren();

        const startIndex = (currentPage - 1) * cardsPerPage;
        const pageData = currentArtistData.slice(startIndex, startIndex + cardsPerPage);

        pageData.forEach(ns => {
            // 1. Tạo Div Card tổng
            const card = document.createElement('div');
            card.style.cssText = `
                display: flex; 
                align-items: center; 
                gap: 15px; 
                background: white; 
                border-radius: 12px; 
                padding: 15px; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.05); 
                cursor: pointer; 
                height: 100%; 
                border: 2px solid transparent;
                transition: all 0.2s ease;
                overflow: hidden;
            `;

            // Hiệu ứng Hover cho Card
            card.onmouseenter = () => {
                card.style.transform = "translateY(-5px)";
                card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
                card.style.borderColor = "#80ceff";
            };
            card.onmouseleave = () => {
                card.style.transform = "translateY(0)";
                card.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
                card.style.borderColor = "transparent";
            };

            // 2. Tạo hình ảnh bên trái (dùng API sinh avatar tạm nếu URL trống hoặc không có http)
            const img = document.createElement('img');
            img.src = (ns.IMAGE_URL)
                      ? ns.IMAGE_URL
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(ns.TEN_NS)}&background=random&size=100`;
            img.style.cssText = "width: 85px; height: 85px; border-radius: 50%; object-fit: cover; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";

            // 3. Tạo Div chứa thông tin bên phải
            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = "display: flex; flex-direction: column; overflow: hidden; flex: 1; min-width: 0;";

            const name = document.createElement('h4');
            name.style.cssText = "margin: 0 0 5px 0; font-size: 16px; color: #262532; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
            name.textContent = ns.TEN_NS;

            const bio = document.createElement('p');
            bio.style.cssText = "margin: 0; font-size: 12px; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;";
            bio.textContent = ns.TIEU_SU || 'Chưa có thông tin.';

            infoDiv.appendChild(name);
            infoDiv.appendChild(bio);

            card.appendChild(img);
            card.appendChild(infoDiv);

            // Bắt sự kiện Click để Xem/Sửa chi tiết
            card.addEventListener('click', () => openArtistModal(ns));

            gridContainer.appendChild(card);
        });

        renderPagination();
    }

    function renderPagination() {
        const paginationContainer = document.getElementById('artist-pagination');
        if (!paginationContainer) return;

        const totalPages = Math.max(1, Math.ceil(currentArtistData.length / cardsPerPage));
        paginationContainer.setAttribute('total-pages', totalPages);
        paginationContainer.setAttribute('current-page', currentPage);
    }

    function setupArtistModal() {
        const addBtn = document.getElementById('btn-open-add-artist');
        const modal = document.getElementById('artist-modal');
        const closeBtn = document.getElementById('close-artist-modal');
        const cancelBtn = document.getElementById('cancel-artist-btn');

        if (!addBtn || !modal) return;

        // Chế độ thêm mới (truyền object rỗng/null)
        addBtn.addEventListener('click', () => openArtistModal(null));

        const closeModal = () => {
            modal.style.display = 'none';
            const form = document.getElementById('artistForm');
            if (form) form.reset();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function openArtistModal(artist) {
        const modal = document.getElementById('artist-modal');
        const form = document.getElementById('artistForm');
        const title = document.getElementById('artist-modal-title');
        const deleteBtn = document.getElementById('delete-artist-btn');

        if (form) form.reset();

        if (artist) {
            // Chế độ Xem & Cập nhật
            title.textContent = "Chi tiết / Cập nhật Nghệ Sĩ";
            document.getElementById('MA_NS').value = artist.MA_NS;
            document.getElementById('TEN_NS').value = artist.TEN_NS;
            document.getElementById('IMAGE_URL').value = artist.IMAGE_URL || '';
            document.getElementById('TIEU_SU').value = artist.TIEU_SU || '';

            deleteBtn.style.display = "block"; // Hiện diện nút xóa ở chế độ edit
        } else {
            // Chế độ Thêm mới
            title.textContent = "Thêm Nghệ Sĩ Mới";
            document.getElementById('MA_NS').value = "";

            deleteBtn.style.display = "none"; // Ẩn nút xóa đi
        }

        modal.style.display = 'flex';
    }

    function setupSearch() {
        document.addEventListener('search-changed', (e) => {
            const keyword = e.detail.value.toLowerCase().trim();

            if (!keyword) {
                currentArtistData = [...allArtistData];
            } else {
                currentArtistData = allArtistData.filter(ns =>
                    (ns.TEN_NS && ns.TEN_NS.toLowerCase().includes(keyword)) ||
                    (ns.TIEU_SU && ns.TIEU_SU.toLowerCase().includes(keyword)) ||
                    (ns.MA_NS && ns.MA_NS.toString().includes(keyword))
                );
            }
            currentPage = 1;
            renderArtistGrid();
        });

        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'artist-pagination') {
                currentPage = e.detail.page;
                renderArtistGrid();
            }
        });
    }

    init();
})();