let searchResults = [];
let currentPage = 1;
const eventsPerPage = 12;

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    initSearch(); // Kích hoạt lại thanh search cho trang này
    executeSearch();
});

// =========================================
// 1. LẤY TỪ KHÓA & LỌC DỮ LIỆU
// =========================================
async function executeSearch() {
    // Lấy từ khóa 'q' từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query) {
        document.getElementById('search-title').innerHTML = `⚠️ Vui lòng nhập từ khóa tìm kiếm.`;
        return;
    }

    // In từ khóa lên tiêu đề
    document.getElementById('search-title').innerHTML = `
        <span class="material-symbols-outlined" style="color: #7CCDFF; font-size: 28px;">search</span> 
        Kết quả tìm kiếm cho: "<span style="color: #1dd1a1;">${query}</span>"
    `;

    try {
        const res = await fetch('http://localhost:8000/api/su-kien');
        const allEvents = await res.json();

        // Chuyển từ khóa về chữ thường để so sánh không phân biệt hoa/thường
        const lowerQuery = query.toLowerCase();

        // Lọc thông minh: Tìm trong Tên sự kiện, Danh mục, hoặc Địa điểm
        searchResults = allEvents.filter(e => {
            if (e.TRANG_THAI !== 1) return false; // Chỉ lấy sự kiện đang hoạt động

            const matchName = e.TEN_SK && e.TEN_SK.toLowerCase().includes(lowerQuery);
            const matchCategory = e.TEN_DM && e.TEN_DM.toLowerCase().includes(lowerQuery);
            const matchLocation = e.TEN_DD && e.TEN_DD.toLowerCase().includes(lowerQuery);

            return matchName || matchCategory || matchLocation;
        });

        // Render giao diện
        if (searchResults.length === 0) {
            document.getElementById('no-events-msg').style.display = 'block';
        } else {
            renderEvents(currentPage);
            renderPagination();
        }
    } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
    }
}

// =========================================
// CÁC HÀM RENDER (Tương tự như Dashboard/EventsByCategory)
// =========================================
function renderEvents(page) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    grid.replaceChildren();

    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const eventsToShow = searchResults.slice(startIndex, endIndex);

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
            window.location.href = `../user/EventDetail.html?id=${event.MA_SK}`;
        });

        grid.appendChild(card);
    });
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    paginationContainer.replaceChildren();

    const totalPages = Math.ceil(searchResults.length / eventsPerPage);
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

// Bắt sự kiện Enter cho ô Search ở ngay trang này
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const keyword = e.target.value.trim();
            if (keyword) {
                window.location.href = `SearchResults.html?q=${encodeURIComponent(keyword)}`;
            }
        }
    });
}

// Hàm checkLoginStatus() copy từ Dashboard qua
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
                <a href="#" id="btn-logout" class="logout-btn">🚪 Đăng xuất</a>
            </div>
        `;

        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('user');
            window.location.reload();
        });
    } else {
        authContainer.innerHTML = `<div class="login"><button onclick="window.location.href='../login/Login.html'">Đăng nhập</button></div>`;
    }
}
