const user = JSON.parse(sessionStorage.getItem('user'));
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

document.addEventListener('DOMContentLoaded', () => {
    mainContentArea = document.getElementById('content-area');
    fetchMenusFromAPI();
    startRealtimeClock();
});

async function fetchMenusFromAPI() {
    try {
        const response = await fetch('http://localhost:8000/api/chuc-nang');
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        menuDataFromDB = await response.json();

        navMenuContainer.replaceChildren();
        initializeSidebar();
    } catch (error) {
        console.error("Lỗi khi kết nối Backend:", error);
        const errorLi = document.createElement('li');
        errorLi.style.color = 'red';
        errorLi.textContent = 'Lỗi tải menu!';
        navMenuContainer.appendChild(errorLi);
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
    menuDataFromDB.forEach((menu, index) => {
        const liElement = document.createElement('li');

        const iconImg = document.createElement('img');
        iconImg.classList.add('menu-icon');
        iconImg.src = `../img/CN${menu.MA_CN}.png`;

        const textSpan = document.createElement('span');
        textSpan.textContent = menu.TEN_CN;

        liElement.appendChild(iconImg);
        liElement.appendChild(textSpan);

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
        mainContentArea.replaceChildren();
        return;
    }

    childrenArray.forEach((child, index) => {
        const tabDiv = document.createElement('div');
        tabDiv.classList.add('tab');
        tabDiv.textContent = child.TEN_CN;

        if (index === 0) {
            tabDiv.classList.add('active-tab');
            loadTabContent(child.MA_CN);
        }

        tabDiv.addEventListener('click', () => {
            const currentActive = topTabsContainer.querySelector('.active-tab');
            if (currentActive) currentActive.classList.remove('active-tab');
            tabDiv.classList.add('active-tab');

            loadTabContent(child.MA_CN);
        });

        topTabsContainer.appendChild(tabDiv);
    });
}

function loadTabContent(maChucNang) {
    // 1. Ẩn tất cả các tab đang hiển thị
    Array.from(mainContentArea.children).forEach(child => {
        child.style.display = 'none';
    });

    // 2. Lấy đường dẫn thực tế từ Route Map
    const filePath = routeMap[maChucNang];

    // 3. Khởi tạo ID tab
    const tabId = `tab-content-${maChucNang}`;
    let currentTab = document.getElementById(tabId);

    // 4. KIỂM TRA: Nếu chức năng chưa làm (không có trong routeMap)
    if (!filePath) {
        if (!currentTab) {
            currentTab = document.createElement('div');
            currentTab.id = tabId;
            currentTab.style.width = '100%';
            currentTab.style.height = '100%';
            currentTab.style.display = 'flex';
            currentTab.style.flexDirection = 'column';
            mainContentArea.appendChild(currentTab);
        }
        currentTab.style.display = 'flex';
        currentTab.innerHTML = `<h2 style="color: white; text-align: center; margin-top: 50px;">🚧 Chức năng CN${maChucNang} đang được phát triển...</h2>`;
        return;
    }

    // 5. KIỂM TRA: NẾU TAB ĐÃ TỒN TẠI (Đã tải trước đó) -> Chỉ cần hiện lên, KHÔNG fetch lại
    if (currentTab) {
        currentTab.style.display = 'flex';
        return;
    }

    // 6. NẾU TAB CHƯA TỒN TẠI -> Tạo container mới và hiện "Đang tải..."
    currentTab = document.createElement('div');
    currentTab.id = tabId;
    currentTab.style.width = '100%';
    currentTab.style.height = '100%';
    currentTab.style.display = 'flex';
    currentTab.style.flexDirection = 'column';
    currentTab.innerHTML = `<h3 style="color: #80ceff; text-align: center; margin-top: 50px;">⏳ Đang tải giao diện...</h3>`;
    mainContentArea.appendChild(currentTab);

    // 7. Bắt đầu fetch file HTML THEO ĐƯỜNG DẪN MỚI
    fetch(`${filePath}.html`)
        .then(response => {
            if (!response.ok) throw new Error("Chưa có file HTML");
            return response.text();
        })
        .then(data => {
            currentTab.innerHTML = data;

            const script = document.createElement('script');
            script.src = `${filePath}.js?t=${new Date().getTime()}`;
            document.body.appendChild(script);
        })
        .catch(error => {
            currentTab.innerHTML = `<h2 style="color: #ff6b6b; text-align: center; margin-top: 50px;">❌ Chức năng đang được xây dựng</h2>`;
        });
}