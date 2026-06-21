const user = JSON.parse(sessionStorage.getItem('user'));

if (!user) {
    alert("Vui lòng đăng nhập để truy cập hệ thống!");
    window.location.href = '../login/Login.html';
}

if (!user || user.quyen === 'Customer' || user.quyen === 'VIP Customer') {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = '../login/Login.html';
}

const routeMap = {
    // Nhóm Sự kiện
    11: 'features/QLSK/CN11_SuKien',
    12: 'features/QLSK/CN12_DiaDiem',
    13: 'features/QLSK/CN13_DanhMuc',
    14: 'features/QLSK/CN14_NgheSi',
    // Nhóm Kinh Doanh
    21: 'features/QLKD/CN21_DonHang',
    22: 'features/QLKD/CN22_KhachHang',
    23: 'features/QLKD/CN23_KhuyenMai',
    // Nhóm Nhân sự
    31: 'features/QLNS/CN31_NhanSu',
    32: 'features/QLNS/CN32_PhanQuyen',
    // Nhóm báo cáo & thống kê
    41: 'features/BCTK/CN41_BaoCaoDoanhThu',
    42: 'features/BCTK/CN42_ThongKeHoatDong',
    // Nhóm soát vé
    51: 'features/SV/CN51_SoatVe',
    52: 'features/SV/CN52_LichSuCheckin',
};

// =====================================================================
// HỆ THỐNG LÕI (CORE) - QUẢN LÝ MENU VÀ CHUYỂN TAB
// =====================================================================
let menuDataFromDB = [];
const navMenuContainer = document.querySelector('.nav-menu');
const topTabsContainer = document.querySelector('.top-tabs');
let mainContentArea;

window.hasPermission = function(ma_cn, action) {
    try {
        const permsStr = sessionStorage.getItem('permissions');
        if (!permsStr) return false;

        const perms = JSON.parse(permsStr);
        const targetId = String(ma_cn).trim();

        // Tìm quyền tương ứng với chức năng (bất chấp Backend trả về MA_CN hay ma_cn)
        const p = perms.find(x => String(x.MA_CN).trim() === targetId || String(x.ma_cn).trim() === targetId);
        if (!p) return false;

        // Lấy giá trị quyền và so sánh lỏng (Loose Equality) để bao quát cả số 1, chuỗi "1" và boolean true
        const val = p[action] !== undefined ? p[action] : p[action.toLowerCase()];
        return val == 1 || val === "1" || val === true;
    } catch (e) {
        console.error("Lỗi kiểm tra quyền:", e);
        return false;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    mainContentArea = document.getElementById('content-area');
    await loadUserPermissions();
    await fetchMenusFromAPI();
    startRealtimeClock();
    setupUserProfile();
});

async function loadUserPermissions() {
    // Chỉ lấy mã nhóm quyền gốc từ Backend trả về, KHÔNG ép dữ liệu giả
    const ma_nq = user.MA_NQ || user.ma_nq;

    if (!ma_nq || ma_nq === 'undefined') {
        console.error("🛑 LỖI NGHIÊM TRỌNG: API Đăng nhập chưa trả về trường MA_NQ. Hệ thống từ chối tải quyền!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/api/phan-quyen/${ma_nq}`);
        if (!response.ok) throw new Error("API phân quyền lỗi mã: " + response.status);

        let data = await response.json();
        // Lấy mảng an toàn đề phòng backend bọc trong object { success: true, data: [...] }
        let perms = Array.isArray(data) ? data : (data.data || []);

        sessionStorage.setItem('permissions', JSON.stringify(perms));
    } catch (error) {
        console.error("Không tải được phân quyền từ DB:", error);
    }
}

async function fetchMenusFromAPI() {
    try {
        const response = await fetch('http://localhost:8000/api/chuc-nang');
        if (!response.ok) throw new Error("API Tải chức năng thất bại.");

        let data = await response.json();
        let rawTreeMenus = Array.isArray(data) ? data : (data.data || []);

        let filteredMenus = [];

        // Lọc menu một cách tường minh, không dùng map().filter() chuỗi gây mất tham chiếu
        for (let menu of rawTreeMenus) {
            const menuId = menu.MA_CN || menu.ma_cn;

            // Chỉ giữ lại menu cha nếu user có quyền XEM
            if (window.hasPermission(menuId, 'XEM')) {
                let newMenu = { ...menu }; // Clone để không ảnh hưởng dữ liệu gốc

                // Lọc tiếp các tab con
                if (newMenu.children && Array.isArray(newMenu.children)) {
                    newMenu.children = newMenu.children.filter(child => {
                        const childId = child.MA_CN || child.ma_cn;
                        return window.hasPermission(childId, 'XEM');
                    });
                }

                filteredMenus.push(newMenu);
            }
        }

        menuDataFromDB = filteredMenus;

        navMenuContainer.replaceChildren();
        initializeSidebar();
    } catch (error) {
        console.error("Lỗi dựng cấu trúc Menu:", error);
    }
}

function startRealtimeClock() {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (!timeEl || !dateEl) return;

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}:${seconds}`;

        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[now.getDay()];
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        dateEl.textContent = `${dayName}, ${day}/${month}/${year}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

function initializeSidebar() {
    if(menuDataFromDB.length === 0) {
        navMenuContainer.innerHTML = '<li style="color:red; text-align:center;">Bạn không có quyền truy cập chức năng nào!</li>';
        return;
    }

    menuDataFromDB.forEach((menu, index) => {
        const liElement = document.createElement('li');
        liElement.innerHTML = `<img class="menu-icon" src="/img/CN${menu.MA_CN}.png"> <span>${menu.TEN_CN}</span>`;

        if (index === 0) {
            liElement.classList.add('active');
            renderTopTabs(menu.children);
        }

        liElement.addEventListener('click', () => {
            const currentActive = navMenuContainer.querySelector('.active');
            if (currentActive) currentActive.classList.remove('active');
            liElement.classList.add('active');
            renderTopTabs(menu.children);
        });
        navMenuContainer.appendChild(liElement);
    });
}

function renderTopTabs(childrenArray) {
    topTabsContainer.replaceChildren();
    if (!childrenArray || childrenArray.length === 0) {
       mainContentArea.innerHTML = `<h3 style="color: #666; text-align: center; margin-top: 50px;">Không có menu con nào trong nhóm này.</h3>`;
        return;
    }

    childrenArray.forEach((child, index) => {
        const childId = child.MA_CN || child.ma_cn;
        const childName = child.TEN_CN || child.ten_cn;

        const tabDiv = document.createElement('div');
        tabDiv.classList.add('tab');
        tabDiv.textContent = childName;

        if (index === 0) {
            tabDiv.classList.add('active-tab');
            loadTabContent(childId);
        }

        tabDiv.addEventListener('click', () => {
            const currentActive = topTabsContainer.querySelector('.active-tab');
            if (currentActive) currentActive.classList.remove('active-tab');
            tabDiv.classList.add('active-tab');
            loadTabContent(childId);
        });

        topTabsContainer.appendChild(tabDiv);
    });
}

window.loadTabContent = function(maChucNang) {
    Array.from(mainContentArea.children).forEach(child => child.style.display = 'none');
    const filePath = routeMap[maChucNang];
    const tabId = `tab-content-${maChucNang}`;
    let currentTab = document.getElementById(tabId);

    if (!filePath) {
        if (!currentTab) {
            currentTab = document.createElement('div');
            currentTab.id = tabId;
            currentTab.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;';
            mainContentArea.appendChild(currentTab);
        }
        currentTab.style.display = 'flex';
        currentTab.innerHTML = `<h2 style="color: white; text-align: center; margin-top: 50px;">🚧 Chức năng đang được phát triển...</h2>`;
        return;
    }

    if (currentTab) {
        currentTab.style.display = 'flex';
        return;
    }

    currentTab = document.createElement('div');
    currentTab.id = tabId;
    currentTab.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;';
    currentTab.innerHTML = `<h3 style="color: #80ceff; text-align: center; margin-top: 50px;">⏳ Đang tải giao diện...</h3>`;
    mainContentArea.appendChild(currentTab);

    fetch(`${filePath}.html`).then(response => {
        if (!response.ok) throw new Error("Chưa có HTML");
        return response.text();
    }).then(data => {
        currentTab.innerHTML = data;
        const script = document.createElement('script');
        script.src = `${filePath}.js?t=${new Date().getTime()}`;
        document.body.appendChild(script);
    }).catch(() => {
        currentTab.innerHTML = `<h2 style="color: #ff6b6b; text-align: center; margin-top: 50px;">❌ Lỗi tải chức năng</h2>`;
    });
};

function setupUserProfile() {
    const userObj = JSON.parse(sessionStorage.getItem('user')) || {};
    const nameFallback = userObj.ten || userObj.TEN || userObj.username || 'Nhân viên';
    const roleFallback = userObj.quyen || 'Quyền hạn';

    document.getElementById('header-user-name').textContent = nameFallback;
    document.getElementById('dropdown-name').textContent = nameFallback;
    document.getElementById('dropdown-role').textContent = roleFallback;

    const avatarImg = document.getElementById('header-avatar-img');
    if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFallback)}&background=80ceff&color=11101C&bold=true`;

    const avatarBtn = document.getElementById('avatar-btn');
    const dropdown = document.getElementById('profile-dropdown');
    if (avatarBtn && dropdown) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        });
        window.addEventListener('click', (e) => {
            if (!avatarBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
        });
    }

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (confirm('🚪 Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
            sessionStorage.clear();
            window.location.href = '../login/Login.html';
        }
    });
}