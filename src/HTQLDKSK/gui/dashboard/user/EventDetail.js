document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    initSearch();
    loadEventDetail();
});

async function loadEventDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = parseInt(urlParams.get('id'));

    if (!eventId) {
        document.getElementById('ev-title').textContent = "⚠️ Lỗi: Không tìm thấy sự kiện";
        return;
    }

    try {
        // Gọi API lấy chi tiết sự kiện
        const response = await fetch(`http://localhost:8000/api/su-kien/${eventId}`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu sự kiện');

        const eventData = await response.json();

        // 1. Cập nhật Hero Banner
        const imgUrl = eventData.IMAGE_URL || 'https://placehold.co/800x450/1b1a29/7CCDFF?text=No+Image';
        document.getElementById('ev-poster').src = imgUrl;
        // Đặt ảnh nền mờ phía sau giống Spotify/Apple Music
        document.getElementById('hero-bg').style.backgroundImage = `url('${imgUrl}')`;

        document.getElementById('ev-category').textContent = eventData.TEN_DM;
        document.getElementById('ev-title').textContent = eventData.TEN_SK;

        const dateObj = new Date(eventData.TG_BAT_DAU);
        document.getElementById('ev-time').textContent = !isNaN(dateObj)
            ? dateObj.toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
            : eventData.TG_BAT_DAU;

        document.getElementById('ev-location').textContent = `${eventData.TEN_DD} - ${eventData.DIA_CHI || ''}`;

        // 2. Cập nhật Mô tả
        document.getElementById('ev-desc').textContent = eventData.MO_TA || "Chưa có thông tin mô tả cho sự kiện này.";

        // 3. Xử lý Trạng thái & Nút Mua Vé
        const statusBadge = document.getElementById('ev-status');
        const btnBook = document.getElementById('btn-book');

        if (eventData.TRANG_THAI === 1) {
            statusBadge.textContent = "🟢 Đang mở bán";
            btnBook.onclick = () => {
                // Chuyển hướng sang trang Chọn ghế / Sơ đồ rạp (Booking.html)
                window.location.href = `Booking.html?id=${eventData.MA_SK}`;
            };
        } else {
            statusBadge.textContent = "🔴 Ngừng bán vé";
            statusBadge.style.color = "#ff6b6b";
            statusBadge.style.background = "rgba(255, 107, 107, 0.15)";
            statusBadge.style.borderColor = "rgba(255, 107, 107, 0.3)";

            btnBook.disabled = true;
            btnBook.style.backgroundColor = "#464555";
            btnBook.style.color = "#C7C4D8";
            btnBook.style.cursor = "not-allowed";
            btnBook.innerHTML = `<span class="material-symbols-outlined">block</span> Đã đóng`;
        }

        // 4. Render Nghệ Sĩ
        const artistsContainer = document.getElementById('ev-artists');
        if (eventData.danh_sach_nghe_si && eventData.danh_sach_nghe_si.length > 0) {
            eventData.danh_sach_nghe_si.forEach(ns => {
                const artistCard = document.createElement('div');
                artistCard.className = 'artist_item'; // Dùng lại class CSS từ Dashboard

                const nsImgUrl = (ns.IMAGE_URL && !ns.IMAGE_URL.startsWith('url/'))
                    ? ns.IMAGE_URL
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(ns.TEN_NS)}&background=random&color=fff&size=120`;

                artistCard.innerHTML = `
                    <div class="artist_avatar" style="width: 100px; height: 100px;">
                        <img src="${nsImgUrl}" alt="${ns.TEN_NS}">
                    </div>
                    <span class="artist_name" style="font-size: 14px; white-space: normal;">${ns.TEN_NS}</span>
                `;

                artistsContainer.appendChild(artistCard);
            });
        } else {
            artistsContainer.innerHTML = `<p style="color: #C7C4D8;">Sự kiện chưa cập nhật danh sách nghệ sĩ.</p>`;
        }

    } catch (error) {
        console.error("Lỗi:", error);
        document.getElementById('ev-title').textContent = "Đã xảy ra lỗi khi tải dữ liệu.";
    }
}

// =========================================
// CÁC HÀM TIỆN ÍCH DÙNG CHUNG
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
                <a href="user/MyTickets.html">🎟️ Quản lý vé</a>
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
