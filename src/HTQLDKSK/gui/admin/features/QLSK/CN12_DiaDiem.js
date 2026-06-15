(() => {
    let currentLocationData = [];
    let currentLocationPage = 1;
    const rowsPerLocationPage = 10;
    let currentEditingLocationId = null;
    let currentMasterLayout = []; // Lưu mảng tọa độ ghế

    function init() {
        loadLocationDataFromAPI();
        setupAddLocationModal();
    }

    async function loadLocationDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/dia-diem');
            if (!response.ok) throw new Error("Lỗi tải API địa điểm");
            currentLocationData = await response.json();
        } catch (error) {
            console.error("Dùng dữ liệu SQL giả định do API lỗi:", error);
            currentLocationData = [
                { MA_DD: 1, TEN_DD: 'Sân vận động Mỹ Đình', DIA_CHI: 'Đường Lê Đức Thọ, Hà Nội', TONG_SO_COT: 50, TONG_SO_HANG: 40 },
                { MA_DD: 2, TEN_DD: 'Nhà hát Lớn Hà Nội', DIA_CHI: '1 Tràng Tiền, Hà Nội', TONG_SO_COT: 20, TONG_SO_HANG: 15 },
                { MA_DD: 3, TEN_DD: 'Sân vận động Thống Nhất', DIA_CHI: 'Đào Duy Từ, TP.HCM', TONG_SO_COT: 40, TONG_SO_HANG: 30 },
                { MA_DD: 4, TEN_DD: 'Trung tâm Hội nghị Quốc gia', DIA_CHI: 'Phạm Hùng, Hà Nội', TONG_SO_COT: 60, TONG_SO_HANG: 50 },
                { MA_DD: 5, TEN_DD: 'Nhà hát Hòa Bình', DIA_CHI: 'Đường 3/2, TP.HCM', TONG_SO_COT: 30, TONG_SO_HANG: 20 },
                { MA_DD: 6, TEN_DD: 'Gem Center', DIA_CHI: 'Nguyễn Bỉnh Khiêm, TP.HCM', TONG_SO_COT: 40, TONG_SO_HANG: 30 },
                { MA_DD: 7, TEN_DD: 'White Palace', DIA_CHI: 'Phạm Văn Đồng, TP.HCM', TONG_SO_COT: 50, TONG_SO_HANG: 40 },
                { MA_DD: 8, TEN_DD: 'Khu du lịch Đại Nam', DIA_CHI: 'Bình Dương', TONG_SO_COT: 100, TONG_SO_HANG: 80 },
                { MA_DD: 9, TEN_DD: 'Nhà thi đấu Phú Thọ', DIA_CHI: 'Lý Thường Kiệt, TP.HCM', TONG_SO_COT: 35, TONG_SO_HANG: 25 },
                { MA_DD: 10, TEN_DD: 'Quảng trường Lâm Viên', DIA_CHI: 'Đà Lạt, Lâm Đồng', TONG_SO_COT: 100, TONG_SO_HANG: 100 }
            ];
        }
        currentLocationPage = 1;
        renderLocationTable();
    }

    function renderLocationTable() {
        const tbody = document.getElementById('location-table-body');
        if (!tbody) return;

        tbody.replaceChildren();

        const startIndex = (currentLocationPage - 1) * rowsPerLocationPage;
        const pageData = currentLocationData.slice(startIndex, startIndex + rowsPerLocationPage);

        pageData.forEach(dd => {
            const tr = document.createElement('tr');

            const tdId = document.createElement('td');
            const strongId = document.createElement('strong');
            strongId.textContent = `DD${dd.MA_DD.toString().padStart(3, '0')}`;
            tdId.appendChild(strongId);

            const tdName = document.createElement('td');
            tdName.textContent = dd.TEN_DD;

            const tdAddress = document.createElement('td');
            tdAddress.textContent = dd.DIA_CHI;

            const tdGrid = document.createElement('td');
            tdGrid.textContent = `${dd.TONG_SO_COT} x ${dd.TONG_SO_HANG}`;

            const tdActions = document.createElement('td');
            tdActions.classList.add('actions');

            const iconMap = document.createElement('img');
            // Bạn có thể dùng tạm icon EDIT hoặc tạo file MAP.png mới
            iconMap.src = '../img/ticket.png';
            iconMap.alt = 'Sơ đồ';
            iconMap.title = 'Thiết kế Sơ đồ gốc';
            iconMap.classList.add('action-icon');
            iconMap.addEventListener('click', () => openLayoutBuilder(dd.MA_DD, dd.TEN_DD))

            const iconEdit = document.createElement('img');
            iconEdit.src = '../img/EDIT.png';
            iconEdit.alt = 'Sửa';
            iconEdit.title = 'Sửa';
            iconEdit.classList.add('action-icon');

            const iconDelete = document.createElement('img');
            iconDelete.src = '../img/DELETE.png';
            iconDelete.alt = 'Xóa';
            iconDelete.title = 'Xóa';
            iconDelete.classList.add('action-icon');

            tdActions.append(iconMap, iconEdit, iconDelete);
            tr.append(tdId, tdName, tdAddress, tdGrid, tdActions);
            tbody.appendChild(tr);
        });

        for (let i = 0; i < (rowsPerLocationPage - pageData.length); i++) {
            const emptyTr = document.createElement('tr');
            for (let j = 0; j < 5; j++) {
                const td = document.createElement('td');
                if (j === 0) td.textContent = '\u00A0';
                emptyTr.appendChild(td);
            }
            tbody.appendChild(emptyTr);
        }

        renderLocationPagination();
    }

    function renderLocationPagination() {
        const paginationContainer = document.getElementById('location-pagination');
        if (!paginationContainer) return;

        paginationContainer.replaceChildren();

        const totalPages = Math.max(1, Math.ceil(currentLocationData.length / rowsPerLocationPage));

        const prevSpan = document.createElement('span');
        prevSpan.textContent = '<';
        prevSpan.onclick = () => { if (currentLocationPage > 1) { currentLocationPage--; renderLocationTable(); } };
        paginationContainer.appendChild(prevSpan);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentLocationPage) pageSpan.classList.add('active');
            pageSpan.onclick = () => { currentLocationPage = i; renderLocationTable(); };
            paginationContainer.appendChild(pageSpan);
        }

        const nextSpan = document.createElement('span');
        nextSpan.textContent = '>';
        nextSpan.onclick = () => { if (currentLocationPage < totalPages) { currentLocationPage++; renderLocationTable(); } };
        paginationContainer.appendChild(nextSpan);
    }

    function setupAddLocationModal() {
        const addBtn = document.getElementById('btn-open-add-location');
        const modal = document.getElementById('add-location-modal');
        const closeBtn = document.getElementById('close-location-modal');
        const cancelBtn = document.getElementById('cancel-location-btn');

        if (!addBtn || !modal) return;

        addBtn.addEventListener('click', () => { modal.style.display = 'flex'; });

        const closeModal = () => {
            modal.style.display = 'none';
            const form = document.getElementById('locationForm');
            if (form) form.reset();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        window.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    }

    function openLayoutBuilder(dd) {
        currentEditingLocationId = dd.MA_DD;
        const modal = document.getElementById('layout-builder-modal');
        document.getElementById('layout-location-name').textContent = dd.TEN_DD;
        modal.style.display = 'flex';

        // Khôi phục layout cũ nếu có
        try {
            currentMasterLayout = dd.LAYOUT_DATA ? JSON.parse(dd.LAYOUT_DATA) : [];
        } catch(e) {
            currentMasterLayout = [];
        }
        renderMasterCanvas();
    }

    function renderMasterCanvas() {
        const canvas = document.getElementById('masterLayoutCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (currentMasterLayout.length === 0) {
            ctx.fillStyle = '#ccc';
            ctx.font = 'italic 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sơ đồ trống. Vui lòng rải ghế...', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Vẽ từng ghế vật lý
        currentMasterLayout.forEach(seat => {
            ctx.beginPath();
            ctx.arc(seat.x, seat.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#6c757d'; // Màu ghế xám chuẩn (chưa có Hạng vé)
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#343a40';
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seat.label, seat.x, seat.y);
        });
    }

    // Đăng ký sự kiện đóng Modal Layout
    document.addEventListener('DOMContentLoaded', () => {
        // Tìm nút sinh ghế trong modal (Bạn cần đặt id cho nút này trong file HTML là btn-generate-master-seats)
        // Code HTML: <button type="button" id="btn-generate-master-seats" class="btn-save"...>
        const btnGenSeats = document.getElementById('btn-generate-master-seats');
        const inputs = document.querySelectorAll('#layout-builder-modal input[type="text"], #layout-builder-modal input[type="number"]');
        let inputDay = null, inputSoGhe = null;

        inputs.forEach(inp => {
            if (inp.placeholder.includes('Dãy')) inputDay = inp;
            if (inp.placeholder.includes('Số ghế')) inputSoGhe = inp;
        });

        if (btnGenSeats && inputDay && inputSoGhe) {
            btnGenSeats.addEventListener('click', () => {
                const day = inputDay.value.trim().toUpperCase();
                const soGhe = parseInt(inputSoGhe.value);

                if (!day || isNaN(soGhe)) {
                    alert('Vui lòng nhập Dãy và Số lượng ghế!');
                    return;
                }

                // Logic rải tọa độ nối tiếp
                let currentTotalRows = Math.ceil(currentMasterLayout.length / 20);
                let startY = 50 + (currentTotalRows * 40);

                for (let i = 1; i <= soGhe; i++) {
                    const x = 50 + ((i - 1) % 20) * 40;
                    const y = startY + Math.floor((i - 1) / 20) * 40;

                    currentMasterLayout.push({
                        label: `${day}${i}`,
                        x: x,
                        y: y
                    });
                }

                inputDay.value = '';
                inputSoGhe.value = '';
                renderMasterCanvas();
            });
        }

        // Xử lý nút Lưu Layout
        const btnSaveLayout = document.getElementById('save-layout-btn');
        if (btnSaveLayout) {
            btnSaveLayout.addEventListener('click', async () => {
                if (!currentEditingLocationId) return;

                // Tìm object địa điểm hiện tại từ state
                const currentDD = currentLocationData.find(d => d.MA_DD === currentEditingLocationId);
                if (!currentDD) return;

                const payload = {
                    TEN_DD: currentDD.TEN_DD,
                    DIA_CHI: currentDD.DIA_CHI,
                    TONG_SO_COT: currentDD.TONG_SO_COT,
                    TONG_SO_HANG: currentDD.TONG_SO_HANG,
                    LAYOUT_DATA: JSON.stringify(currentMasterLayout) // Đóng gói tọa độ
                };

                try {
                    const res = await fetch(`http://localhost:8000/api/dia-diem/${currentEditingLocationId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        alert('Đã lưu Sơ đồ Master thành công!');
                        document.getElementById('layout-builder-modal').style.display = 'none';
                        loadLocationDataFromAPI(); // Refresh data
                    } else {
                        alert('Lưu thất bại!');
                    }
                } catch (error) {
                    console.error(error);
                }
            });
        }
    });

    // Kích hoạt
    init();
})();