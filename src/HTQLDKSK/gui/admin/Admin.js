// Biến toàn cục lưu dữ liệu menu từ Database
let menuDataFromDB = [];
const navMenuContainer = document.querySelector('.nav-menu');
const topTabsContainer = document.querySelector('.top-tabs');

function loadTableComponent() {
    fetch('../TableComponent.html')
        .then(response => {
            if (!response.ok) throw new Error('Lỗi không tải được component bảng');
            return response.text();
        })
        .then(data => {
            document.getElementById('table-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Lỗi:', error));
}

async function fetchMenusFromAPI() {
    try {
        const response = await fetch('http://localhost:8000/api/chuc-nang');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        menuDataFromDB = await response.json();
        navMenuContainer.replaceChildren(); // Làm sạch container
        initializeSidebar();

    } catch (error) {
        console.error("Lỗi khi kết nối Backend:", error);
        navMenuContainer.innerHTML = "<li style='color:red;'>Lỗi tải menu! Hãy kiểm tra Server.</li>";
    }
}

function renderTopTabs(childrenArray) {
    topTabsContainer.replaceChildren();

    if (!childrenArray || childrenArray.length === 0) return;

    childrenArray.forEach((child, index) => {
        const tabDiv = document.createElement('div');
        tabDiv.classList.add('tab');
        tabDiv.textContent = child.TEN_CN;

        if (index === 0) {
            tabDiv.classList.add('active-tab');
        }

        tabDiv.addEventListener('click', () => {
            const currentActive = topTabsContainer.querySelector('.active-tab');
            if (currentActive) currentActive.classList.remove('active-tab');
            tabDiv.classList.add('active-tab');

            console.log("Đang mở Tab ID:", child.MA_CN);
        });

        topTabsContainer.appendChild(tabDiv);
    });
}

function initializeSidebar() {
    menuDataFromDB.forEach((menu, index) => {
        const liElement = document.createElement('li');
        liElement.textContent = menu.TEN_CN;

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

document.addEventListener('DOMContentLoaded', () => {
    loadTableComponent();
    fetchMenusFromAPI();
});