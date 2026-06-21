let categoryEvents = [];
let currentPage = 1;
const eventsPerPage = 12;

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); // Kế thừa hàm kiểm tra đăng nhập
    loadCategoryData();
});

// =========================================
// 1. TẢI DỮ LIỆU & LỌC THEO DANH MỤC
// =========================================
async function loadCategoryData() {
    // Lấy ID danh mục từ thanh URL (Ví dụ: ?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = parseInt(urlParams.get('id'));

    if (!categoryId) {
        document.getElementById('category-title').innerHTML = `⚠️ Lỗi: Không tìm thấy danh mục`;
        return;
    }

    try {
        // A. Lấy tên danh mục để in lên Tiêu đề
        const catRes = await fetch('http://localhost:8000/api/danh-muc-su-kien');
        const categories = await catRes.json();
        const currentCategory = categories.find(c => c.MA_DMSK === categoryId);

        if (currentCategory) {
            document.getElementById('category-title').innerHTML = `
                <span class="material-symbols-outlined" style="color: #7CCDFF; font-size: 28px;">category</span> 
                Sự kiện: ${currentCategory.TEN_DM}
            `;
        }

        // B. Lấy danh sách sự kiện và LỌC
        const evRes = await fetch('http://localhost:8000/api/su-kien');
        const allEvents = await evRes.json();

        // Lọc các sự kiện: (1) Đang hoạt động và (2) Khớp mã danh mục
        categoryEvents = allEvents.filter(e => e.TRANG_THAI === 1 && e.MA_DMSK === categoryId);

        // C. Render giao diện
        if (categoryEvents.length === 0) {
            document.getElementById('no-events-msg').style.display = 'block';
        } else {
            renderEvents(currentPage);
            renderPagination();
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// =========================================
// 2. RENDER LƯỚI SỰ KIỆN (Kế thừa từ Dashboard)
// =========================================
function renderEvents(page) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    grid.replaceChildren();

    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const eventsToShow = categoryEvents.slice(startIndex, endIndex);

    eventsToShow.forEach(event => {
        const card = document.createElement('div');
        card.classList.add('event_card');

        const imgUrl = (event.IMAGE_URL && event.IMAGE_URL !== '')
            ? event.IMAGE_URL
            : 'https://placehold.co/400x250/1b1a29/7CCDFF?text=Event+Image';

        const dateObj = new Date(event.TG_BAT_DAU);
        const dateStr = !isNaN(dateObj)
            ? dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : event.TG_BAT_DAU;

        card.innerHTML = `
            <div class="event_card_img">
                <img src="${imgUrl}" alt="${event.TEN_SK}" onerror="this.src='https://placehold.co/400x250/1b1a29/7CCDFF?text=No+Image'">
                <span class="event_badge">${event.TEN_DM}</span>
            </div>
            <div class="event_info">
                <h4 class="event_title" title="${event.TEN_SK}">${event.TEN_SK}</h4>
                <div class="event_meta">
                    <span class="material-symbols-outlined icon-small">calendar_month</span>
                    <span>${dateStr}</span>
                </div>
                <div class="event_meta">
                    <span class="material-symbols-outlined icon-small">location_on</span>
                    <span class="truncate-text" title="${event.TEN_DD}">${event.TEN_DD}</span>
                </div>
                <div class="event_footer" style="justify-content: center;">
                    <button class="btn_book" style="width: 100%;">Mua vé ngay</button>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `EventDetail.html?id=${event.MA_SK}`;
        });

        grid.appendChild(card);
    });
}

// =========================================
// 3. RENDER PHÂN TRANG (Kế thừa từ Dashboard)
// =========================================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    paginationContainer.replaceChildren();

    const totalPages = Math.ceil(categoryEvents.length / eventsPerPage);
    if (totalPages <= 1) return;

    // Nút Trước
    const prevBtn = document.createElement('button');
    prevBtn.classList.add('page_btn');
    prevBtn.textContent = '<';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderEvents(currentPage);
            renderPagination();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Nút Số
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('page_btn');
        pageBtn.textContent = i;
        if (i === currentPage) pageBtn.classList.add('active');

        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderEvents(currentPage);
            renderPagination();
        });
        paginationContainer.appendChild(pageBtn);
    }

    // Nút Sau
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('page_btn');
    nextBtn.textContent = '>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderEvents(currentPage);
            renderPagination();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// =========================================
// 4. KIỂM TRA ĐĂNG NHẬP HEADER
// =========================================
function checkLoginStatus() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    const userStr = sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.ho_ten)}&background=random`;

        authContainer.innerHTML = `
            <button class="user-profile-btn">
                <img src="${avatarUrl}" alt="User Avatar">
                <span>${user.ho_ten}</span>
            </button>
            <div class="user-dropdown">
                <a href="#">👤 Hồ sơ cá nhân</a>
                <a href="#">🎟️ Quản lý vé</a>
                ${(user.quyen !== 'Customer' && user.quyen !== 'VIP Customer' && user.quyen !== 'Guest') 
                    ? `<a href="../admin/Admin.html">⚙️ Kênh quản trị</a>` 
                    : ''}
                <a href="#" id="btn-logout" class="logout-btn">🚪 Đăng xuất</a>
            </div>
        `;

        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('user');
            window.location.reload();
        });
    } else {
        authContainer.innerHTML = `
            <div class="login">
                <button onclick="window.location.href='../login/Login.html'">Đăng nhập</button>
            </div>
        `;
    }
}