document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadAllCategories();
});

// =========================================
// 1. TẢI VÀ RENDER TẤT CẢ DANH MỤC
// =========================================
async function loadAllCategories() {
    try {
        const response = await fetch('http://localhost:8000/api/danh-muc-su-kien');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        const grid = document.getElementById('all-categories-grid');
        grid.replaceChildren();

        // Map cấu hình icon (Kế thừa từ trang chủ)
        const iconMap = {
            'Âm nhạc & Giải trí': { icon: 'local_fire_department', color: '#ff6b6b' },
            'Thể thao & E-Sports': { icon: 'sports_esports', color: '#ff9ff3' },
            'Giáo dục & Công nghệ': { icon: 'school', color: '#1dd1a1' },
            'Sân khấu & Nghệ thuật': { icon: 'theater_comedy', color: '#5f27cd' },
            'Văn hóa & Triển lãm': { icon: 'palette', color: '#feca57' }
        };

        // Render toàn bộ danh mục không cắt bớt
        data.forEach(item => {
            const categoryItem = document.createElement('div');
            categoryItem.classList.add('category_item');

            const config = iconMap[item.TEN_DM] || { icon: 'category', color: '#C7C4D8' };

            categoryItem.innerHTML = `
                <div class="category_icon_box">
                    <span class="material-symbols-outlined" style="color: ${config.color}; font-size: 24px;">${config.icon}</span>
                </div>
                <span class="category_title">${item.TEN_DM}</span>
                <span class="category_subtitle">Khám phá sự kiện</span>
            `;

            // Click vào sẽ chuyển hướng sang trang chi tiết danh mục
            categoryItem.addEventListener('click', () => {
                window.location.href = `EventsByCategory.html?id=${item.MA_DMSK}`;
            });

            grid.appendChild(categoryItem);
        });

    } catch (error) {
        console.error('Lỗi khi tải toàn bộ danh mục:', error);
    }
}

// =========================================
// 2. QUẢN LÝ HEADER ĐĂNG NHẬP
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
            window.location.href = '../login/Login.html';
        });
    } else {
        authContainer.innerHTML = `
            <div class="login">
                <button onclick="window.location.href='../login/Login.html'">Đăng nhập</button>
            </div>
        `;
    }
}