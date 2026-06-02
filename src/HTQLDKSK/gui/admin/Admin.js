// =====================================================================
// PHẦN 1: HỆ THỐNG LÕI (CORE) - QUẢN LÝ MENU VÀ CHUYỂN TAB
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

// 1.1. Gọi API lấy Menu
async function fetchMenusFromAPI() {
    try {
        const response = await fetch('http://localhost:8000/api/chuc-nang');
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        menuDataFromDB = await response.json();
        navMenuContainer.replaceChildren();
        initializeSidebar();
    } catch (error) {
        console.error("Lỗi khi kết nối Backend:", error);
        navMenuContainer.innerHTML = "<li style='color:red;'>Lỗi tải menu!</li>";
    }
}

// 1.2. Vẽ Menu Trái (Sidebar)
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

// 1.3. Vẽ Tabs Ngang (Top Tabs)
function renderTopTabs(childrenArray) {
    topTabsContainer.replaceChildren();

    if (!childrenArray || childrenArray.length === 0) {
        mainContentArea.innerHTML = '';
        return;
    }

    childrenArray.forEach((child, index) => {
        const tabDiv = document.createElement('div');
        tabDiv.classList.add('tab');
        tabDiv.textContent = child.TEN_CN;

        if (index === 0) {
            tabDiv.classList.add('active-tab');
            loadTabContent(child.MA_CN); // Tự động load nội dung tab đầu tiên
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

// 1.4. Router tải HTML theo chức năng (Giống Controller)
function loadTabContent(maChucNang) {
    fetch(`features/CN${maChucNang}.html`)
        .then(response => {
            if (!response.ok) throw new Error("Chưa có file HTML");
            return response.text();
        })
        .then(data => {
            // 1. Đổ mã HTML vào màn hình
            mainContentArea.innerHTML = data;

            // 2. Tùy theo Tab nào được mở thì gọi Data của Tab đó
            if (maChucNang == 11) {
                loadEventDataFromAPI(); // Gọi logic của CN11
            } else if (maChucNang == 12) {
                // loadLocationDataFromAPI(); // Sau này bạn làm CN12 thì gọi ở đây
            }
        })
        .catch(error => {
            mainContentArea.innerHTML = `<h2 style="color: white; text-align: center; margin-top: 50px;">Đang phát triển tính năng: CN${maChucNang}</h2>`;
        });
}

function startRealtimeClock() {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (!timeEl || !dateEl) return;

    function updateClock() {
        const now = new Date();

        // Lấy và format Giờ:Phút:Giây (luôn có 2 chữ số)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}:${seconds}`;

        // Lấy và format Thứ, Ngày/Tháng/Năm
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[now.getDay()];
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng trong JS bắt đầu từ 0
        const year = now.getFullYear();
        dateEl.textContent = `${dayName}, ${day}/${month}/${year}`;
    }

    updateClock(); // Gọi ngay lập tức để không bị delay 1 giây đầu tiên
    setInterval(updateClock, 1000); // Lặp lại hàm mỗi 1000ms (1 giây)
}


// =====================================================================
// PHẦN 2: LOGIC TỪNG CHỨC NĂNG (FEATURE MODULES)
// =====================================================================

// --------------------------------------------------------
// [CN11] - QUẢN LÝ DANH SÁCH SỰ KIỆN
// --------------------------------------------------------
let currentEventData = [];
let currentEventPage = 1;
const rowsPerEventPage = 10;

async function loadEventDataFromAPI() {
    try {
        const response = await fetch('http://localhost:8000/api/events');
        if (!response.ok) throw new Error("Lỗi tải API sự kiện");
        currentEventData = await response.json();
        currentEventPage = 1;
        renderEventTable();
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

function renderEventTable() {
    const tbody = document.getElementById('event-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const startIndex = (currentEventPage - 1) * rowsPerEventPage;
    const pageData = currentEventData.slice(startIndex, startIndex + rowsPerEventPage);

    pageData.forEach(sk => {
        const tr = document.createElement('tr');

        const dateObj = new Date(sk.TG_BAT_DAU);
        const formattedDate = `${dateObj.getDate().toString().padStart(2,'0')} / ${(dateObj.getMonth()+1).toString().padStart(2,'0')} / ${dateObj.getFullYear()} - ${dateObj.getHours()}h${dateObj.getMinutes().toString().padStart(2,'0')}`;

        tr.innerHTML = `
            <td><strong>${sk.TEN_SK}</strong><br><small>SK${sk.MA_SK.toString().padStart(3,'0')} - ${sk.TEN_DM}</small></td>
            <td>${formattedDate}</td>
            <td>${sk.TEN_DD}</td>
            <td>${sk.VE_DA_BAN}</td>
            <td>${sk.TRANG_THAI === 1 ? 'Đang bán' : 'Đã khóa'}</td>
            <td class="actions">
                <img src="../img/EDIT.png" alt="Sửa" class="action-icon" title="Sửa">
                <img src="../img/LOCK.png" alt="Khóa" class="action-icon" title="Khóa">
                <img src="../img/DELETE.png" alt="Xóa" class="action-icon" title="Xóa">
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Bù dòng rỗng
    for (let i = 0; i < (rowsPerEventPage - pageData.length); i++) {
        const emptyTr = document.createElement('tr');
        emptyTr.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(emptyTr);
    }

    renderEventPagination();
}

function renderEventPagination() {
    const paginationContainer = document.getElementById('event-pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(currentEventData.length / rowsPerEventPage));

    const prevSpan = document.createElement('span');
    prevSpan.textContent = '<';
    prevSpan.onclick = () => { if (currentEventPage > 1) { currentEventPage--; renderEventTable(); } };
    paginationContainer.appendChild(prevSpan);

    for (let i = 1; i <= totalPages; i++) {
        const pageSpan = document.createElement('span');
        pageSpan.textContent = i;
        if (i === currentEventPage) pageSpan.classList.add('active');

        pageSpan.onclick = () => { currentEventPage = i; renderEventTable(); };
        paginationContainer.appendChild(pageSpan);
    }

    const nextSpan = document.createElement('span');
    nextSpan.textContent = '>';
    nextSpan.onclick = () => { if (currentEventPage < totalPages) { currentEventPage++; renderEventTable(); } };
    paginationContainer.appendChild(nextSpan);
}

// --------------------------------------------------------
// [CN12] - QUẢN LÝ ĐỊA ĐIỂM (Viết logic ở đây sau này)
// --------------------------------------------------------