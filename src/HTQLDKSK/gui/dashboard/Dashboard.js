let allEvents = [];
let currentPage = 1;
const eventsPerPage = 12;

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    fetchCategoryEvents();
    initSlider();
    fetchAllEvents();
    fetchArtists();
    initSearch();
});

// =========================================
// KIỂM TRA ĐĂNG NHẬP & HEADER
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

function initSearch() {
    // Tìm ô input bên trong thanh search
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    // Lắng nghe sự kiện gõ phím
    searchInput.addEventListener('keypress', function (e) {
        // Nếu phím bấm là Enter (mã phím là 'Enter' hoặc 13)
        if (e.key === 'Enter') {
            e.preventDefault(); // Ngăn hành vi mặc định (nếu có)
            const keyword = e.target.value.trim(); // Lấy từ khóa và xóa khoảng trắng 2 đầu

            if (keyword) {
                // Chuyển hướng sang trang kết quả tìm kiếm kèm theo từ khóa
                // (Lưu ý đường dẫn có thể cần đổi thành '../SearchResults.html' tùy thư mục của bạn)
                window.location.href = `search/SearchResults.html?q=${encodeURIComponent(keyword)}`;
            }
        }
    });
}

// =========================================
// RENDER DANH MỤC
// =========================================
function fetchCategoryEvents() {
    fetch('http://localhost:8000/api/danh-muc-su-kien')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const container = document.querySelector('.category_events');
            container.replaceChildren();

            const iconMap = {
                'Âm nhạc & Giải trí': { icon: 'local_fire_department', color: '#ff6b6b' },
                'Thể thao & E-Sports': { icon: 'sports_esports', color: '#ff9ff3' },
                'Giáo dục & Công nghệ': { icon: 'school', color: '#1dd1a1' },
                'Sân khấu & Nghệ thuật': { icon: 'theater_comedy', color: '#5f27cd' },
                'Văn hóa & Triển lãm': { icon: 'palette', color: '#feca57' }
            };

            const MAX_DISPLAY = 4;
            const displayData = data.slice(0, MAX_DISPLAY);
            const hasMore = data.length > MAX_DISPLAY;

            displayData.forEach(item => {
                const categoryItem = document.createElement('div');
                categoryItem.classList.add('category_item');

                const config = iconMap[item.TEN_DM] || { icon: 'category', color: '#C7C4D8' };

                const iconBox = document.createElement('div');
                iconBox.classList.add('category_icon_box');
                const iconNode = document.createElement('span');
                iconNode.classList.add('material-symbols-outlined');
                iconNode.textContent = config.icon;
                iconNode.style.color = config.color;
                iconBox.appendChild(iconNode);

                const titleElement = document.createElement('span');
                titleElement.classList.add('category_title');
                titleElement.textContent = item.TEN_DM;

                const subtitleElement = document.createElement('span');
                subtitleElement.classList.add('category_subtitle');
                subtitleElement.textContent = 'Khám phá ngay';

                categoryItem.appendChild(iconBox);
                categoryItem.appendChild(titleElement);
                categoryItem.appendChild(subtitleElement);

                categoryItem.addEventListener('click', () => {
                    window.location.href = `category/EventsByCategory.html?id=${item.MA_DMSK}`;
                });

                container.appendChild(categoryItem);
            });

            if (hasMore) {
                const moreItem = document.createElement('div');
                moreItem.classList.add('category_item');
                moreItem.style.backgroundColor = 'rgba(124, 204, 255, 0.05)';

                const iconBox = document.createElement('div');
                iconBox.classList.add('category_icon_box');
                const iconNode = document.createElement('span');
                iconNode.classList.add('material-symbols-outlined');
                iconNode.textContent = 'grid_view';
                iconNode.style.color = '#7CCDFF';
                iconBox.appendChild(iconNode);

                const titleElement = document.createElement('span');
                titleElement.classList.add('category_title');
                titleElement.textContent = 'Xem thêm';
                titleElement.style.color = '#7CCDFF';

                const subtitleElement = document.createElement('span');
                subtitleElement.classList.add('category_subtitle');
                subtitleElement.textContent = `+${data.length - MAX_DISPLAY} chủ đề khác`;

                moreItem.appendChild(iconBox);
                moreItem.appendChild(titleElement);
                moreItem.appendChild(subtitleElement);

                moreItem.addEventListener('click', () => {
                    window.location.href = 'category/AllCategories.html';
                });

                container.appendChild(moreItem);
            }
        })
        .catch(error => console.error('Lỗi khi tải danh mục sự kiện:', error));
}

// =========================================
// SLIDER
// =========================================
function initSlider() {
    const track = document.querySelector('.slider_track');
    const dots = document.querySelectorAll('.dot');

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            const index = dot.getAttribute('data-index');
            track.style.transform = `translateX(-${index * 100}%)`;
        });
    });
}

// =========================================
// CALL API & QUẢN LÝ DỮ LIỆU SỰ KIỆN
// =========================================
async function fetchAllEvents() {
    try {
        const response = await fetch('http://localhost:8000/api/su-kien');
        if (!response.ok) throw new Error('Lỗi tải danh sách sự kiện');

        const data = await response.json();

        // Lọc sự kiện đang hoạt động (TRANG_THAI == 1)
        allEvents = data.filter(e => e.TRANG_THAI === 1);

        renderTrendingEvents();
        renderRecommendedEvents();
        renderEvents(currentPage);
        renderPagination();
    } catch (error) {
        console.error(error);
    }
}

// =========================================
// RENDER TOP 10 XU HƯỚNG
// =========================================
function renderTrendingEvents() {
    const track = document.getElementById('trending-track');
    if (!track) return;
    track.replaceChildren();

    const trending = [...allEvents]
        .sort((a, b) => (b.VE_DA_BAN || 0) - (a.VE_DA_BAN || 0))
        .slice(0, 10);

    trending.forEach((event, index) => {
        const item = document.createElement('div');
        item.className = 'trending_item';

        const imgUrl = (event.IMAGE_URL && event.IMAGE_URL !== '')
            ? event.IMAGE_URL
            : 'https://placehold.co/400x225/1b1a29/7CCDFF?text=Poster'; // Đổi 300x450 thành 400x225

        item.innerHTML = `
            <div class="trending_rank">${index + 1}</div>
            <div class="trending_poster">
                <img src="${imgUrl}" alt="${event.TEN_SK}" onerror="this.src='https://placehold.co/400x225/1b1a29/7CCDFF?text=No+Image'">
            </div>
        `;

        item.addEventListener('click', () => {
            window.location.href = `EventDetail.html?id=${event.MA_SK}`;
        });

        track.appendChild(item);
    });
}

// =========================================
// RENDER LƯỚI "TẤT CẢ SỰ KIỆN"
// =========================================
function renderEvents(page) {
    const grid = document.querySelector('.events_grid');
    if (!grid) return;
    grid.replaceChildren();

    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const eventsToShow = allEvents.slice(startIndex, endIndex);

    eventsToShow.forEach(event => {
        const card = document.createElement('div');
        card.classList.add('event_card');

        // Xử lý ảnh: dùng ảnh mặc định nếu không có url
        const imgUrl = (event.IMAGE_URL && event.IMAGE_URL !== '')
            ? event.IMAGE_URL
            : 'https://placehold.co/400x250/1b1a29/7CCDFF?text=Event+Image';

        // Xử lý ngày tháng cho thân thiện với người dùng
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

        // Click vào thẻ để chuyển trang chi tiết sự kiện
        card.addEventListener('click', () => {
            window.location.href = `EventDetail.html?id=${event.MA_SK}`;
        });

        grid.appendChild(card);
    });
}

// =========================================
// RENDER PHÂN TRANG
// =========================================
function renderPagination() {
    const paginationContainer = document.querySelector('.pagination_controls');
    if (!paginationContainer) return;
    paginationContainer.replaceChildren();

    const totalPages = Math.ceil(allEvents.length / eventsPerPage);
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

        if (i === currentPage) {
            pageBtn.classList.add('active');
        }

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
// CALL API & QUẢN LÝ DỮ LIỆU NGHỆ SĨ
// =========================================
async function fetchArtists() {
    try {
        // Gọi API lấy toàn bộ nghệ sĩ từ DB
        const response = await fetch('http://localhost:8000/api/nghe-si');
        if (!response.ok) throw new Error('Lỗi tải danh sách nghệ sĩ');

        const data = await response.json();
        renderArtists(data);
    } catch (error) {
        console.error(error);
    }
}

function renderArtists(artistsData) {
    const track = document.getElementById('artist-track');
    if (!track) return;
    track.replaceChildren();

    // CHỈ LẤY 10 NGHỆ SĨ ĐẦU TIÊN
    const displayArtists = artistsData.slice(0, 10);

    displayArtists.forEach(ns => {
        const item = document.createElement('div');
        item.className = 'artist_item';

        // Xử lý ảnh: Nếu CSDL chưa có ảnh (url/sontung.jpg đang bị lỗi), ta dùng ui-avatars để tạo ảnh chữ cái ngẫu nhiên
        const imgUrl = (ns.IMAGE_URL && ns.IMAGE_URL !== '' && !ns.IMAGE_URL.startsWith('url/'))
            ? ns.IMAGE_URL
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(ns.TEN_NS)}&background=random&color=fff&size=120`;

        item.innerHTML = `
            <div class="artist_avatar">
                <img src="${imgUrl}" alt="${ns.TEN_NS}">
            </div>
            <span class="artist_name">${ns.TEN_NS}</span>
        `;

        // Có thể thêm event chuyển hướng khi click vào nghệ sĩ
        item.addEventListener('click', () => {
            window.location.href = `ArtistDetail.html?id=${ns.MA_NS}`;
        });

        track.appendChild(item);
    });
}


// Gọi hàm này bên trong fetchAllEvents() sau khi đã có data
function renderRecommendedEvents() {
    const hintContainer = document.querySelector('.events_hints');
    if (!hintContainer) return;

    // 1. Reset vùng chứa
    hintContainer.replaceChildren();

    // 2. Tạo tiêu đề
    const titleHeader = document.createElement('h3');
    titleHeader.innerHTML = `<span class="material-symbols-outlined" style="color: #1dd1a1; font-size: 28px;">auto_awesome</span> Dành riêng cho bạn`;
    hintContainer.appendChild(titleHeader);

    // 3. Tạo thanh trượt ngang
    const track = document.createElement('div');
    track.className = 'trending_track';
    track.style.gap = '20px'; // Thu hẹp khoảng cách giữa các thẻ dọc cho cân đối
    track.style.paddingBottom = '20px';
    hintContainer.appendChild(track);

    // 4. MÔ PHỎNG AI ENGINE: Tính điểm (Scoring) cho từng sự kiện
    const userStr = sessionStorage.getItem('user');
    let userPreferredCategories = [];

    if (userStr) {
        // Tương lai: Lấy từ Python API
        userPreferredCategories = ['Âm nhạc & Giải trí', 'Thể thao & E-Sports'];
    } else {
        // COLD-START: Gợi ý đại trà
        userPreferredCategories = ['Âm nhạc & Giải trí', 'Sân khấu & Nghệ thuật'];
    }

    const scoredEvents = allEvents.map(event => {
        let score = 0;

        // Tiêu chí 1: Sở thích cá nhân (Content-based)
        if (userPreferredCategories.includes(event.TEN_DM)) {
            score += 50;
        }

        // Tiêu chí 2: Yếu tố đám đông (Popularity)
        score += (event.VE_DA_BAN || 0) * 0.5;

        // Tiêu chí 3: Yếu tố ngẫu nhiên (Exploration)
        score += Math.random() * 20;

        return { event, score };
    });

    // 5. Sắp xếp lấy Top 10 sự kiện có điểm AI cao nhất
    scoredEvents.sort((a, b) => b.score - a.score);
    const recommendations = scoredEvents.slice(0, 10);

    // 6. Xây dựng thẻ sự kiện (POSTER DỌC TỶ LỆ 2:3)
    recommendations.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'trending_item';

        // GHI ĐÈ KÍCH THƯỚC: Ép thẻ thành form dọc thay vì form ngang của Trending
        card.style.minWidth = '220px';
        card.style.height = '330px';

        // Đổi link ảnh dự phòng thành độ phân giải dọc (300x450)
        const imgUrl = (item.event.IMAGE_URL && item.event.IMAGE_URL !== '')
            ? item.event.IMAGE_URL
            : 'https://placehold.co/300x450/1b1a29/1dd1a1?text=For+You';

        // Ghi đè kích thước của poster bên trong HTML
        card.innerHTML = `
            <div class="trending_poster" style="margin-left: 0; width: 220px; height: 330px;"> 
                <img src="${imgUrl}" alt="${item.event.TEN_SK}" onerror="this.src='https://placehold.co/300x450/1b1a29/1dd1a1?text=No+Image'">
                <span class="event_badge" style="background: rgba(29, 209, 161, 0.2); color: #1dd1a1; border-color: rgba(29, 209, 161, 0.4);">
                    ${item.event.TEN_DM}
                </span>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `EventDetail.html?id=${item.event.MA_SK}`;
        });

        track.appendChild(card);
    });
}