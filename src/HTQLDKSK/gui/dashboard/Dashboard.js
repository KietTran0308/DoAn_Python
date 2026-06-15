let allEvents = [];
let currentPage = 1;
const eventsPerPage = 8;

// Cập nhật lại sự kiện DOMContentLoaded để gọi đồng thời cả API và Slider
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    fetchCategoryEvents();
    initSlider();
    fetchAllEvents();
});

function checkLoginStatus() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    // Lấy thông tin user từ session (do login.js tạo ra)
    const userStr = sessionStorage.getItem('user');

    if (userStr) {
        // --- TRẠNG THÁI: ĐÃ ĐĂNG NHẬP ---
        const user = JSON.parse(userStr);
        // Dùng API tạo avatar ngẫu nhiên theo tên nếu không có ảnh
        const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.ho_ten)}&background=random`;

        // Vẽ nút Avatar và Dropdown Menu
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

        // Bắt sự kiện Đăng xuất
        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('user'); // Xóa session
            window.location.reload(); // Tải lại trang (Sẽ tự quay về trạng thái chưa đăng nhập)
        });

    } else {
        // --- TRẠNG THÁI: CHƯA ĐĂNG NHẬP ---
        authContainer.innerHTML = `
            <div class="login">
                <button onclick="window.location.href='../login/Login.html'">Đăng nhập</button>
            </div>
        `;
    }
}

function fetchCategoryEvents() {
    fetch('http://localhost:8000/api/danh-muc-su-kien')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const container = document.querySelector('.category_events');
            container.replaceChildren();

            data.forEach(item => {
                const categoryItem = document.createElement('div');
                categoryItem.classList.add('category_item');

                // Tạo thẻ tiêu đề
                const titleElement = document.createElement('span');
                titleElement.textContent = item.TEN_DM;

                // Gắn các phần tử con vào thẻ bao bọc
                categoryItem.appendChild(titleElement);

                // Gắn thẻ bao bọc vào container chính
                container.appendChild(categoryItem);
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải danh mục sự kiện:', error);
        });
}

// Hàm khởi tạo tính năng Slider
function initSlider() {
    const track = document.querySelector('.slider_track');
    const dots = document.querySelectorAll('.dot');

    // Lặp qua từng dấu chấm để gắn sự kiện click
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            // 1. Xóa trạng thái 'active' của tất cả các dots
            dots.forEach(d => d.classList.remove('active'));

            // 2. Thêm trạng thái 'active' cho dot vừa được click
            dot.classList.add('active');

            // 3. Lấy vị trí index (0 đến 4) từ thẻ HTML
            const index = dot.getAttribute('data-index');

            // 4. Tính toán khoảng cách dịch chuyển và áp dụng vào Track
            // Ví dụ: index = 1 -> lùi sang trái -100% (hiện banner 2)
            track.style.transform = `translateX(-${index * 100}%)`;
        });
    });
}

function fetchAllEvents() {
    fetch('http://localhost:8000/api/su-kien')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allEvents = data;
            renderEvents(currentPage);
            renderPagination();
        })
        .catch(error => {
            console.error('Lỗi khi tải danh sách sự kiện:', error);
        });
}

function renderEvents(page) {
    const grid = document.querySelector('.events_grid');
    grid.replaceChildren(); // Xóa sạch dữ liệu cũ

    // Tính toán chỉ số mốc (start, end)
    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const eventsToShow = allEvents.slice(startIndex, endIndex);

    eventsToShow.forEach(event => {
        const card = document.createElement('div');
        card.classList.add('event_card');

        // Hình ảnh
        const img = document.createElement('img');
        img.src = event.IMAGE_URL || '../img/default-banner.jpg'; // Ảnh dự phòng nếu null
        img.alt = event.TEN_SK;

        // Container thông tin
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('event_info');

        // Danh mục
        const category = document.createElement('span');
        category.classList.add('event_category');
        category.textContent = event.TEN_DM;

        // Tiêu đề
        const title = document.createElement('h4');
        title.textContent = event.TEN_SK;

        // Thời gian
        const timePara = document.createElement('p');
        timePara.textContent = `🕒 ${event.TG_BAT_DAU}`;

        // Địa điểm
        const locationPara = document.createElement('p');
        locationPara.textContent = `📍 ${event.TEN_DD}`;

        // Trạng thái
        const statusPara = document.createElement('p');
        statusPara.textContent = event.TRANG_THAI_TEXT;

        // Gắn các thành phần vào DOM
        infoDiv.appendChild(category);
        infoDiv.appendChild(title);
        infoDiv.appendChild(timePara);
        infoDiv.appendChild(locationPara);
        infoDiv.appendChild(statusPara);

        card.appendChild(img);
        card.appendChild(infoDiv);

        grid.appendChild(card);
    });
}

function renderPagination() {
    const paginationContainer = document.querySelector('.pagination_controls');
    paginationContainer.replaceChildren();

    const totalPages = Math.ceil(allEvents.length / eventsPerPage);

    // Không hiện phân trang nếu chỉ có 1 trang
    if (totalPages <= 1) return;

    // Nút "Trước"
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

    // Các nút số trang
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

    // Nút "Sau"
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