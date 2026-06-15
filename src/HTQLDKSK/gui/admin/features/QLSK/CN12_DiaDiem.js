(() => {
    let currentLocationData = [];
    let currentLocationPage = 1;
    const rowsPerLocationPage = 10;
    let currentEditingLocationId = null;
    let currentMasterLayout = []; // Lưu mảng tọa độ ghế
    let isManualDrawing = false;
    let currentDayPrefix = 'A';
    let currentSeatNumber = 1;
    let currentBackgroundImage = null;

    function init() {
        loadLocationDataFromAPI();
        setupAddLocationModal();
        setupLayoutBuilderEvents();
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
            iconMap.addEventListener('click', () => openLayoutBuilder(dd));

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
        const saveBtn = document.getElementById('save-location-btn'); // Nút lưu

        if (!addBtn || !modal) return;

        const closeModal = () => {
            modal.style.display = 'none';
            const form = document.getElementById('locationForm');
            if (form) form.reset();
        };

        addBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });

        // Bổ sung logic xử lý Gửi Data tạo Địa điểm
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const tenDD = document.getElementById('TEN_DD').value.trim();
                const diaChi = document.getElementById('DIA_CHI').value.trim();
                const soCot = document.getElementById('TONG_SO_COT').value;
                const soHang = document.getElementById('TONG_SO_HANG').value;

                if (!tenDD || !diaChi) {
                    alert('Vui lòng nhập tên và địa chỉ địa điểm!');
                    return;
                }

                const payload = {
                    TEN_DD: tenDD,
                    DIA_CHI: diaChi,
                    TONG_SO_COT: parseInt(soCot) || 50,
                    TONG_SO_HANG: parseInt(soHang) || 40
                };

                try {
                    const res = await fetch('http://localhost:8000/api/dia-diem', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        alert('✅ Thêm địa điểm thành công!');
                        closeModal();
                        loadLocationDataFromAPI(); // Tải lại bảng
                    } else {
                        const err = await res.json();
                        alert('❌ Lỗi: ' + (err.error || 'Không thể lưu'));
                    }
                } catch (error) {
                    console.error(error);
                }
            });
        }
    }

    function openLayoutBuilder(dd) {
        currentEditingLocationId = dd.MA_DD;
        const workspace = document.getElementById('layout-builder-fullscreen');
        document.getElementById('layout-location-name').textContent = dd.TEN_DD;

        // Hiển thị workspace full màn hình và khóa cuộn trang nền
        workspace.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Tự động set kích thước Canvas dựa theo kích thước vùng chứa (container)
        const canvasContainer = document.getElementById('canvas-container');
        const canvas = document.getElementById('masterLayoutCanvas');

        // Cho canvas to bằng vùng chứa hiện tại, trừ hao một chút margin
        canvas.width = canvasContainer.clientWidth - 40;
        canvas.height = canvasContainer.clientHeight - 40;

        // Khôi phục layout cũ nếu có
        try {
            currentMasterLayout = dd.LAYOUT_DATA ? JSON.parse(dd.LAYOUT_DATA) : [];
        } catch(e) {
            currentMasterLayout = [];
        }

        // Reset lại ảnh nền nếu mở địa điểm mới
        currentBackgroundImage = null;
        const uploadBgInput = document.getElementById('upload-background');
        if (uploadBgInput) uploadBgInput.value = '';

        renderMasterCanvas();
    }

    // Cập nhật lại hàm renderMasterCanvas()
    function renderMasterCanvas() {
        const canvas = document.getElementById('masterLayoutCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. VẼ ẢNH NỀN (NẾU CÓ)
        if (currentBackgroundImage) {
            // Vẽ ảnh full Canvas
            ctx.drawImage(currentBackgroundImage, 0, 0, canvas.width, canvas.height);
        } else if (currentMasterLayout.length === 0) {
            // Chỉ hiển thị text nếu không có ảnh và không có ghế
            ctx.fillStyle = '#ccc';
            ctx.font = 'italic 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sơ đồ trống. Tải ảnh mặt bằng và rải ghế...', canvas.width / 2, canvas.height / 2);
        }

        // 2. VẼ CÁC CHẤM GHẾ (Giữ nguyên đoạn code cũ của bạn)
        currentMasterLayout.forEach(seat => {
            ctx.beginPath();
            ctx.arc(seat.x, seat.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#6c757d';
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
    function setupLayoutBuilderEvents() {
        const workspace = document.getElementById('layout-builder-fullscreen');
        const cancelBtn = document.getElementById('cancel-layout-btn');
        const btnToggleDraw = document.getElementById('btn-generate-master-seats');
        const btnSaveLayout = document.getElementById('save-layout-btn');
        const canvas = document.getElementById('masterLayoutCanvas');

        const inputDay = document.getElementById('MASTER_DAY_GHE');
        const inputSoGhe = document.getElementById('MASTER_SO_GHE');
        const uploadBgInput = document.getElementById('upload-background');

        const btnUndo = document.getElementById('btn-undo-seat');
        const btnClear = document.getElementById('btn-clear-seats');

        if (uploadBgInput) {
            uploadBgInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = new Image();
                    img.onload = function () {
                        currentBackgroundImage = img;

                        // Mở rộng canvas nếu ảnh nền to hơn kích thước màn hình hiện tại
                        if (img.width > canvas.width) canvas.width = img.width;
                        if (img.height > canvas.height) canvas.height = img.height;

                        renderMasterCanvas();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnUndo) {
            btnUndo.addEventListener('click', () => {
                if (currentMasterLayout.length > 0) {
                    // Xóa phần tử cuối cùng khỏi mảng
                    currentMasterLayout.pop();

                    // Trả lùi số ghế lại 1 đơn vị (nếu đang > 1) để rải lại cho đúng
                    if (currentSeatNumber > 1) {
                        currentSeatNumber--;
                        if (inputSoGhe) inputSoGhe.value = currentSeatNumber;
                    }

                    // Vẽ lại Canvas
                    renderMasterCanvas();
                }
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (currentMasterLayout.length === 0) return;
                if (confirm('⚠️ Bạn có chắc chắn muốn xóa TOÀN BỘ ghế đã rải trên sơ đồ này không?')) {
                    currentMasterLayout = []; // Xóa sạch mảng
                    currentSeatNumber = 1; // Reset số đếm về 1
                    if (inputSoGhe) inputSoGhe.value = currentSeatNumber;
                    renderMasterCanvas();
                }
            });
        }

        // 1. Logic đóng Workspace
        const closeLayoutWorkspace = () => {
            workspace.style.display = 'none';
            document.body.style.overflow = 'auto'; // Mở lại cuộn trang
            currentEditingLocationId = null;
            currentMasterLayout = [];
            currentBackgroundImage = null;
            if (uploadBgInput) uploadBgInput.value = '';

            isManualDrawing = false;
            if (canvas) canvas.style.cursor = 'default';
            if (btnToggleDraw) {
                btnToggleDraw.style.background = '#6c757d';
                btnToggleDraw.textContent = '⚡ Kích hoạt rải ghế';
            }
        };

        if (cancelBtn) cancelBtn.addEventListener('click', closeLayoutWorkspace);

        // 2. Logic Kích hoạt/Hủy chế độ click rải ghế
        if (btnToggleDraw) {
            btnToggleDraw.addEventListener('click', () => {
                isManualDrawing = !isManualDrawing;

                if (isManualDrawing) {
                    currentDayPrefix = inputDay.value.trim().toUpperCase();
                    currentSeatNumber = parseInt(inputSoGhe.value);

                    if (!currentDayPrefix || isNaN(currentSeatNumber)) {
                        alert('Vui lòng nhập Dãy (VD: A) và Số bắt đầu (VD: 1) trước khi rải ghế!');
                        isManualDrawing = false;
                        return;
                    }

                    // Đổi UI báo hiệu đang rải
                    btnToggleDraw.style.background = '#e74c3c';
                    btnToggleDraw.textContent = '🛑 Đang rải ghế (Click để dừng)';
                    canvas.style.cursor = 'crosshair';
                } else {
                    btnToggleDraw.style.background = '#6c757d';
                    btnToggleDraw.textContent = '⚡ Kích hoạt rải ghế';
                    canvas.style.cursor = 'default';
                }
            });
        }

        // 3. Logic Click chuột lên Canvas để sinh tọa độ
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => {
                if (!isManualDrawing) return;

                // Click chuột phải (button === 2) để hủy nhanh chế độ rải ghế
                if (e.button === 2) {
                    isManualDrawing = false;
                    btnToggleDraw.style.background = '#6c757d';
                    btnToggleDraw.textContent = '⚡ Kích hoạt rải ghế';
                    canvas.style.cursor = 'default';
                    return;
                }

                if (e.button !== 0) return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const existingIndex = currentMasterLayout.findIndex(
                    s => s.DAY_GHE === currentDayPrefix && s.SO_GHE === currentSeatNumber
                );

                if (existingIndex >= 0) {
                    // GIẢI QUYẾT VẤN ĐỀ 1 & 2: Nếu đã tồn tại -> Chỉ cập nhật tọa độ (Dời ghế)
                    currentMasterLayout[existingIndex].x = x;
                    currentMasterLayout[existingIndex].y = y;
                } else {
                    // Nếu chưa tồn tại -> Thêm ghế mới
                    currentMasterLayout.push({
                        label: `${currentDayPrefix}${currentSeatNumber}`,
                        DAY_GHE: currentDayPrefix,
                        SO_GHE: currentSeatNumber,
                        x: x,
                        y: y
                    });
                }

                currentSeatNumber++;
                if (inputSoGhe) inputSoGhe.value = currentSeatNumber;

                renderMasterCanvas();
            });

            // Ngăn menu chuột phải hiện lên khi thao tác trên Canvas
            canvas.addEventListener('contextmenu', e => e.preventDefault());
        }

        // 4. Logic Lưu Master Layout
        if (btnSaveLayout) {
            btnSaveLayout.addEventListener('click', async () => {
                if (!currentEditingLocationId) return;

                const currentDD = currentLocationData.find(d => d.MA_DD === currentEditingLocationId);
                if (!currentDD) return;

                const payload = {
                    TEN_DD: currentDD.TEN_DD,
                    DIA_CHI: currentDD.DIA_CHI,
                    TONG_SO_COT: currentDD.TONG_SO_COT,
                    TONG_SO_HANG: currentDD.TONG_SO_HANG,
                    LAYOUT_DATA: JSON.stringify(currentMasterLayout)
                };

                try {
                    const res = await fetch(`http://localhost:8000/api/dia-diem/${currentEditingLocationId}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        alert('✅ Đã lưu Sơ đồ Master thành công!');
                        closeLayoutWorkspace();
                        loadLocationDataFromAPI();
                    } else {
                        const err = await res.json();
                        alert('❌ Lưu thất bại: ' + (err.error || ''));
                    }
                } catch (error) {
                    console.error("Lỗi khi gọi API lưu layout:", error);
                }
            });
        }
    }

    // Kích hoạt
    init();
})();