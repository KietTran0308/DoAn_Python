(() => {
    let allLocationData = [];
    let currentLocationData = [];
    let currentLocationPage = 1;
    const rowsPerLocationPage = 10;

    let currentMasterLayout = [];
    let isDeletingMode = false;

    // --- State cho ZONE_BASED ---
    let currentBackgroundImage = null;
    let zonePolygons = []; // Mảng chứa các khu vực đã hoàn thành
    let currentPolygon = []; // Mảng chứa các đỉnh đang vẽ dở
    let isDrawingPolygon = false;
    let isDeletingPolygonMode = false;

    let currentEditingLocationId = null;
    let isManualDrawing = false;
    let currentDayPrefix = 'A';
    let currentSeatNumber = 1
    let currentFloorPlanImage = null;
    let currentLocationType = 'FIXED_SEAT';
    let currentCols = 0;
    let currentRows = 0;

    let currentSearchKeyword = '';

    function init() {
        loadLocationDataFromAPI();
        setupSearch();
        setupLocationBuilderEvents();
    }

    async function loadLocationDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/dia-diem');
            if (!response.ok) throw new Error("Lỗi tải API địa điểm");
            allLocationData = await response.json();
        } catch (error) {
            console.error("Dùng dữ liệu SQL giả định do API lỗi:", error);
            allLocationData = [
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
        currentLocationData = [...allLocationData];
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
            tr.innerHTML = `
                <td><b>DD${dd.MA_DD.toString().padStart(3, '0')}</b></td>
                <td><strong style="color: #262532;">${dd.TEN_DD}</strong></td>
                <td>${dd.DIA_CHI}</td>
                <td>${dd.TONG_SO_COT || '-'} x ${dd.TONG_SO_HANG || '-'}</td>
                <td class="actions">
                    <img src="/img/EDIT.png" alt="Sửa" class="action-icon">
                    <img src="/img/DELETE.png" alt="Xóa" class="action-icon">
                </td>
            `;
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

        const totalPages = Math.max(1, Math.ceil(currentLocationData.length / rowsPerLocationPage));
        paginationContainer.setAttribute('total-pages', totalPages);
        paginationContainer.setAttribute('current-page', currentLocationPage);
    }

    function setupAddLocationModal() {
        const modal = document.getElementById('add-location-modal');
        const btnOpen = document.getElementById('btn-open-add-location');
        const btnClose = document.getElementById('close-add-location-modal');
        const btnCancel = document.getElementById('btn-cancel-location');
        const btnNext = document.getElementById('btn-next-to-builder');
        const selectType = document.getElementById('LOAI_DD');

        // Mở Modal
        btnOpen.addEventListener('click', () => {
            document.getElementById('add-location-form').reset();
            selectType.dispatchEvent(new Event('change')); // Đảm bảo UI update đúng form
            modal.style.display = 'flex';
        });

        // Đóng modal an toàn (Check null tránh crash)
        if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');
        if (btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');

        selectType.addEventListener('change', (e) => {
            currentLocationType = e.target.value;
            if (currentLocationType === 'FIXED_SEAT') {
                document.getElementById('config_fixed_seat').style.display = 'block';
                document.getElementById('config_zone_based').style.display = 'none';
            } else {
                document.getElementById('config_fixed_seat').style.display = 'none';
                document.getElementById('config_zone_based').style.display = 'block';
            }
        });

        btnNext.addEventListener('click', () => {
            const tenDD = document.getElementById('TEN_DD').value;
            if (!tenDD) return alert('Vui lòng nhập tên địa điểm!');

            // Lưu cấu hình lưới không gian
            currentCols = parseInt(document.getElementById('TONG_SO_COT').value) || 50;
            currentRows = parseInt(document.getElementById('TONG_SO_HANG').value) || 40;

            modal.style.display = 'none'; // Đóng form

            // Mở Builder
            const builder = document.getElementById('layout-builder-fullscreen');
            builder.style.display = 'flex';
            document.getElementById('builder-location-name').textContent = tenDD;

            const canvas = document.getElementById('masterLayoutCanvas');
            const ctx = canvas.getContext('2d');

            // Tự động mở rộng canvas dựa trên thông số (mỗi ghế tốn 40px)
            if (currentLocationType === 'FIXED_SEAT') {
                canvas.width = Math.max(1000, currentCols * 40 + 100);
                canvas.height = Math.max(700, currentRows * 40 + 100);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            currentMasterLayout = [];
            currentBackgroundImage = null;

            if (currentLocationType === 'FIXED_SEAT') {
                document.getElementById('toolbar_fixed_seat').style.display = 'flex';
                document.getElementById('toolbar_zone_based').style.display = 'none';
                drawGrid(ctx, canvas.width, canvas.height);
            } else {
                document.getElementById('toolbar_fixed_seat').style.display = 'none';
                document.getElementById('toolbar_zone_based').style.display = 'flex';

                const fileInput = document.getElementById('FLOOR_PLAN_IMG');
                if (fileInput.files && fileInput.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const img = new Image();
                        img.onload = function () {
                            canvas.width = Math.max(1000, img.width);
                            canvas.height = Math.max(700, img.height);
                            currentBackgroundImage = img;
                            renderMasterCanvas();
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                }
            }
        });
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

        // 1. Vẽ nền
        if (currentBackgroundImage) {
            ctx.drawImage(currentBackgroundImage, 0, 0, canvas.width, canvas.height);
        } else if (document.getElementById('LOAI_DD').value === 'FIXED_SEAT') {
            // Vẽ lưới nếu là Fixed Seat chưa có ảnh
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let x = 0; x <= canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
            for (let y = 0; y <= canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
        }

        // 2. Vẽ Ghế (Nếu FIXED_SEAT)
        if (document.getElementById('LOAI_DD').value === 'FIXED_SEAT') {
            currentMasterLayout.forEach(seat => {
                ctx.beginPath();
                ctx.arc(seat.x, seat.y, 14, 0, 2 * Math.PI);
                ctx.fillStyle = '#7CCDFF'; ctx.fill();
                ctx.lineWidth = 1; ctx.strokeStyle = '#100F1A'; ctx.stroke();
                ctx.fillStyle = '#100F1A'; ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(seat.label, seat.x, seat.y);
            });
        }

        // 3. Vẽ các Khu vực Đa giác (Nếu ZONE_BASED)
        if (document.getElementById('LOAI_DD').value === 'ZONE_BASED') {
            // Vẽ các vùng đã hoàn thành
            zonePolygons.forEach(poly => {
                ctx.beginPath();
                ctx.moveTo(poly.points[0].x, poly.points[0].y);
                for(let i=1; i<poly.points.length; i++) ctx.lineTo(poly.points[i].x, poly.points[i].y);
                ctx.closePath();

                ctx.fillStyle = 'rgba(155, 89, 182, 0.4)'; // Màu tím trong suốt
                ctx.fill();
                ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 2; ctx.stroke();

                // Viết tên & sức chứa ở điểm đầu
                ctx.fillStyle = '#100F1A';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`${poly.name} (${poly.capacity} người)`, poly.points[0].x, poly.points[0].y - 10);
            });

            // Vẽ vùng đang được vẽ dở (Chấm đỏ nét đứt)
            if (currentPolygon.length > 0) {
                ctx.beginPath();
                ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
                for(let i=1; i<currentPolygon.length; i++) ctx.lineTo(currentPolygon[i].x, currentPolygon[i].y);

                ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);

                currentPolygon.forEach(pt => {
                    ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI*2);
                    ctx.fillStyle = '#e74c3c'; ctx.fill();
                });
            }
        }
    }

    // Đăng ký sự kiện đóng Modal Layout
    function setupLayoutBuilderEvents() {
        const workspace = document.getElementById('layout-builder-fullscreen');
        const closeBtn = document.getElementById('close-builder-btn');
        const saveBtn = document.getElementById('save-master-layout-btn');
        const btnGenMatrix = document.getElementById('btn-generate-matrix');
        const btnDeleteSeat = document.getElementById('btn-delete-seat');
        const canvas = document.getElementById('masterLayoutCanvas');

        // 1. Đóng Workspace
        if (closeBtn) closeBtn.addEventListener('click', () => {
            workspace.style.display = 'none';
            document.body.style.overflow = 'auto';
            isDeletingMode = false;
        });

        // 2. NÚT SINH MA TRẬN TỰ ĐỘNG
        if (btnGenMatrix) {
            btnGenMatrix.addEventListener('click', () => {
                if (confirm(`Hệ thống sẽ sinh tự động ${currentCols * currentRows} ghế. Ghế cũ sẽ bị xóa, bạn đồng ý chứ?`)) {
                    currentMasterLayout = [];
                    const startX = 40;
                    const startY = 40;
                    const spacing = 40;

                    for (let r = 0; r < currentRows; r++) {
                        // Tính ký tự hàng: A, B, ... Z, AA, AB
                        let rowLabel = String.fromCharCode(65 + (r % 26));
                        if (r >= 26) rowLabel = 'A' + String.fromCharCode(65 + (r % 26));

                        for (let c = 0; c < currentCols; c++) {
                            currentMasterLayout.push({
                                label: `${rowLabel}${c + 1}`,
                                DAY_GHE: rowLabel,
                                SO_GHE: c + 1,
                                x: startX + c * spacing,
                                y: startY + r * spacing
                            });
                        }
                    }
                    renderMasterCanvas();
                }
            });
        }

        // 3. CHẾ ĐỘ CỤC TẨY (XÓA GHẾ VƯỚNG LỐI ĐI)
        if (btnDeleteSeat) {
            btnDeleteSeat.addEventListener('click', () => {
                isDeletingMode = !isDeletingMode;
                if (isDeletingMode) {
                    btnDeleteSeat.style.background = '#ff6b6b';
                    btnDeleteSeat.style.color = 'white';
                    canvas.style.cursor = 'no-drop'; // Chuột hình dấu cấm
                } else {
                    btnDeleteSeat.style.background = 'transparent';
                    btnDeleteSeat.style.color = '#ff6b6b';
                    canvas.style.cursor = 'crosshair';
                }
            });
        }

        // 4. XỬ LÝ CLICK TRÊN CANVAS (ĐỂ XÓA)
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => {
                if (!isDeletingMode || e.button !== 0) return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Tìm xem click có trúng cái ghế nào không (bán kính 15px)
                const index = currentMasterLayout.findIndex(seat => {
                    const distance = Math.sqrt(Math.pow(seat.x - x, 2) + Math.pow(seat.y - y, 2));
                    return distance <= 15;
                });

                if (index !== -1) {
                    // TRƯỜNG HỢP 1: NẾU CLICK TRÚNG GHẾ ĐÃ CÓ -> XÓA GHẾ ĐÓ ĐI
                    currentMasterLayout.splice(index, 1);
                } else {
                    // TRƯỜNG HỢP 2: CLICK VÀO CHỖ TRỐNG -> THÊM GHẾ MỚI VÀO ĐÓ
                    // Tự động Snap (Hít) vào tọa độ lưới gần nhất (Bội số của 40)
                    const snapX = Math.round(x / 40) * 40;
                    const snapY = Math.round(y / 40) * 40;

                    // Ngăn việc thêm ghế sát rìa ngoài cùng (Tọa độ <= 0)
                    if (snapX > 0 && snapY > 0) {
                        // Tự động nội suy ra Tên Dãy và Số Ghế dựa vào tọa độ Y và X
                        const rowIndex = Math.round((snapY - 40) / 40);
                        let rowLabel = String.fromCharCode(65 + (rowIndex % 26));
                        if (rowIndex >= 26) rowLabel = 'A' + String.fromCharCode(65 + (rowIndex % 26));

                        const colIndex = Math.round((snapX - 40) / 40) + 1;

                        // Thêm vào mảng
                        currentMasterLayout.push({
                            label: `${rowLabel}${colIndex}`,
                            DAY_GHE: rowLabel,
                            SO_GHE: colIndex,
                            x: snapX,
                            y: snapY
                        });
                    }
                }

                // Vẽ lại Canvas để cập nhật hiển thị ngay lập tức
                renderMasterCanvas();
            });
        }

        // 5. LƯU LAYOUT XUỐNG DATABASE
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                // Tạo payload ảo dựa vào Form lúc đầu (hoặc bạn gắn API PUT nếu đang Edit)
                alert(`✅ Đã lưu cấu hình gồm ${currentMasterLayout.length} ghế! (Mô phỏng API)`);
                workspace.style.display = 'none';
            });
        }
    }

    function drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    function setupSearch() {
        const filterCity = document.getElementById('filter-city');
        const filterType = document.getElementById('filter-type');
        const filterStatus = document.getElementById('filter-status');

        // Hàm kiểm tra và áp dụng cả 4 tiêu chí lọc cùng lúc
        function applyAllFilters() {
            const cityVal = filterCity ? filterCity.value : '';
            const typeVal = filterType ? filterType.value : '';
            const statusVal = filterStatus ? filterStatus.value : '';

            currentLocationData = allLocationData.filter(loc => {
                // 1. Lọc theo Keyword (Thanh Search)
                let matchKeyword = true;
                if (currentSearchKeyword) {
                    matchKeyword = (loc.TEN_DD && loc.TEN_DD.toLowerCase().includes(currentSearchKeyword)) ||
                                   (loc.DIA_CHI && loc.DIA_CHI.toLowerCase().includes(currentSearchKeyword));
                }

                // 2. Lọc theo Tỉnh/Thành phố
                let matchCity = true;
                if (cityVal) {
                    matchCity = loc.DIA_CHI && loc.DIA_CHI.includes(cityVal);
                }

                // 3. Lọc theo Loại hình địa điểm
                let matchType = true;
                if (typeVal) {
                    // Nếu data cũ không có trường LOAI_DD, mặc định coi là FIXED_SEAT
                    const locType = loc.LOAI_DD || 'FIXED_SEAT';
                    matchType = (locType === typeVal);
                }

                // 4. Lọc theo Trạng thái Sơ đồ (Dựa vào LAYOUT_DATA có dữ liệu hay không)
                let matchStatus = true;
                if (statusVal !== '') {
                    // Kiểm tra xem LAYOUT_DATA có hợp lệ và khác rỗng không
                    const isConfigured = loc.LAYOUT_DATA && loc.LAYOUT_DATA !== '[]' && loc.LAYOUT_DATA !== 'null';

                    if (statusVal === '1') matchStatus = isConfigured;       // Đã cấu hình
                    if (statusVal === '0') matchStatus = !isConfigured;      // Chưa cấu hình
                }

                // Phải thỏa mãn toàn bộ các điều kiện đang chọn
                return matchKeyword && matchCity && matchType && matchStatus;
            });

            currentLocationPage = 1;
            renderLocationTable();
        }

        // Lắng nghe gõ phím từ Web Component
        document.addEventListener('search-changed', (e) => {
            currentSearchKeyword = e.detail.value.toLowerCase().trim();
            applyAllFilters();
        });

        // Lắng nghe thay đổi từ các thẻ Select
        if (filterCity) filterCity.addEventListener('change', applyAllFilters);
        if (filterType) filterType.addEventListener('change', applyAllFilters);
        if (filterStatus) filterStatus.addEventListener('change', applyAllFilters);

        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'location-pagination') {
                currentLocationPage = e.detail.page;
                renderLocationTable();
            }
        });
    }

    function setupLocationBuilderEvents() {
        const builderScreen = document.getElementById('location-builder-fullscreen');
        const selectType = document.getElementById('LOAI_DD');
        const canvas = document.getElementById('masterLayoutCanvas');

        // NÚT MỞ GIAO DIỆN
        document.getElementById('btn-open-add-location')?.addEventListener('click', () => {
            document.getElementById('add-location-form').reset();
            currentMasterLayout = [];
            zonePolygons = [];
            currentPolygon = [];
            currentBackgroundImage = null;
            isDrawingPolygon = false;
            isDeletingMode = false;
            selectType.dispatchEvent(new Event('change')); // Reset UI theo dropdown

            builderScreen.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            renderMasterCanvas();
        });

        // ĐÓNG GIAO DIỆN
        document.getElementById('close-location-builder')?.addEventListener('click', () => {
            builderScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        // CHUYỂN ĐỔI LOẠI ĐỊA ĐIỂM
        selectType.addEventListener('change', (e) => {
            if (e.target.value === 'FIXED_SEAT') {
                document.getElementById('tools_fixed_seat').style.display = 'block';
                document.getElementById('tools_zone_based').style.display = 'none';
            } else {
                document.getElementById('tools_fixed_seat').style.display = 'none';
                document.getElementById('tools_zone_based').style.display = 'block';
            }
            currentMasterLayout = [];
            zonePolygons = [];
            currentBackgroundImage = null;
            renderMasterCanvas();
        });

        // TỰ ĐỘNG CẬP NHẬT TÊN LÊN HEADER
        document.getElementById('TEN_DD').addEventListener('input', (e) => {
            document.getElementById('preview-loc-name').textContent = e.target.value || 'Chưa đặt tên';
        });

        // ================= CÔNG CỤ FIXED_SEAT =================
        document.getElementById('btn-generate-matrix')?.addEventListener('click', () => {
            const cols = parseInt(document.getElementById('TONG_SO_COT').value) || 30;
            const rows = parseInt(document.getElementById('TONG_SO_HANG').value) || 20;

            canvas.width = Math.max(1000, cols * 40 + 100);
            canvas.height = Math.max(700, rows * 40 + 100);
            currentMasterLayout = [];

            for (let r = 0; r < rows; r++) {
                let rowLabel = String.fromCharCode(65 + (r % 26));
                if (r >= 26) rowLabel = 'A' + String.fromCharCode(65 + (r % 26));
                for (let c = 0; c < cols; c++) {
                    currentMasterLayout.push({ label: `${rowLabel}${c + 1}`, x: 40 + c * 40, y: 40 + r * 40 });
                }
            }
            renderMasterCanvas();
        });

        const btnToggleEdit = document.getElementById('btn-toggle-seat-edit');
        btnToggleEdit?.addEventListener('click', () => {
            isDeletingMode = !isDeletingMode;
            btnToggleEdit.style.background = isDeletingMode ? '#e74c3c' : 'transparent';
            btnToggleEdit.style.color = isDeletingMode ? 'white' : '#e74c3c';
            btnToggleEdit.textContent = isDeletingMode ? '✅ Đang bật chế độ Sửa' : '🖍️ Bật chế độ Thêm/Xóa ghế';
        });

        // ================= CÔNG CỤ ZONE_BASED =================
        document.getElementById('FLOOR_PLAN_IMG')?.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        canvas.width = Math.max(1000, img.width);
                        canvas.height = Math.max(700, img.height);
                        currentBackgroundImage = img;
                        renderMasterCanvas();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });

        const btnDrawPoly = document.getElementById('btn-draw-polygon');
        const btnFinishPoly = document.getElementById('btn-finish-polygon');
        const btnDelPoly = document.getElementById('btn-delete-polygon');

        btnDrawPoly?.addEventListener('click', () => {
            isDrawingPolygon = true;
            isDeletingPolygonMode = false;
            currentPolygon = [];
            btnDrawPoly.style.display = 'none';
            btnFinishPoly.style.display = 'block';
            canvas.style.cursor = 'crosshair';
        });

        btnFinishPoly?.addEventListener('click', () => {
            if (currentPolygon.length >= 3) {
                const zoneName = prompt("Nhập tên cho Khu vực này (VD: Fanzone A):");
                const capacity = prompt("Nhập sức chứa tối đa của khu vực này (Số vé):", "1000");
                if (zoneName && capacity) {
                    zonePolygons.push({ points: [...currentPolygon], name: zoneName, capacity: capacity });
                }
            } else {
                alert("Vùng phải có ít nhất 3 điểm!");
            }
            isDrawingPolygon = false;
            currentPolygon = [];
            btnDrawPoly.style.display = 'block';
            btnFinishPoly.style.display = 'none';
            canvas.style.cursor = 'default';
            renderMasterCanvas();
        });

        btnDelPoly?.addEventListener('click', () => {
            isDeletingPolygonMode = !isDeletingPolygonMode;
            btnDelPoly.style.background = isDeletingPolygonMode ? '#e74c3c' : 'transparent';
            btnDelPoly.style.color = isDeletingPolygonMode ? 'white' : '#e74c3c';
            btnDelPoly.textContent = isDeletingPolygonMode ? '✅ Đang bật Xóa vùng' : '🗑️ Bật chế độ Xóa Khu vực';
        });

        // ================= XỬ LÝ SỰ KIỆN CLICK TRÊN CANVAS =================
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const type = document.getElementById('LOAI_DD').value;

            if (type === 'FIXED_SEAT' && isDeletingMode && e.button === 0) {
                // Xóa hoặc Thêm ghế tĩnh
                const index = currentMasterLayout.findIndex(seat => Math.sqrt(Math.pow(seat.x - x, 2) + Math.pow(seat.y - y, 2)) <= 15);
                if (index !== -1) {
                    currentMasterLayout.splice(index, 1);
                } else {
                    const snapX = Math.round(x / 40) * 40;
                    const snapY = Math.round(y / 40) * 40;
                    if (snapX > 0 && snapY > 0) {
                        const rowIndex = Math.round((snapY - 40) / 40);
                        let rowLabel = String.fromCharCode(65 + (rowIndex % 26));
                        const colIndex = Math.round((snapX - 40) / 40) + 1;
                        currentMasterLayout.push({ label: `${rowLabel}${colIndex}`, x: snapX, y: snapY });
                    }
                }
                renderMasterCanvas();
            }
            else if (type === 'ZONE_BASED' && e.button === 0) {
                if (isDrawingPolygon) {
                    // Chấm điểm cho Polygon
                    currentPolygon.push({x, y});
                    renderMasterCanvas();
                } else if (isDeletingPolygonMode) {
                    // Kiểm tra click vào Polygon nào để xóa
                    const ctx = canvas.getContext('2d');
                    for (let i = zonePolygons.length - 1; i >= 0; i--) {
                        const path = new Path2D();
                        const pts = zonePolygons[i].points;
                        path.moveTo(pts[0].x, pts[0].y);
                        for(let j=1; j<pts.length; j++) path.lineTo(pts[j].x, pts[j].y);
                        path.closePath();

                        if (ctx.isPointInPath(path, x, y)) {
                            if(confirm(`Xóa khu vực "${zonePolygons[i].name}"?`)) {
                                zonePolygons.splice(i, 1);
                                renderMasterCanvas();
                            }
                            break;
                        }
                    }
                }
            }
        });

        // ================= NÚT LƯU ĐỊA ĐIỂM =================
        document.getElementById('save-location-btn')?.addEventListener('click', () => {
            const name = document.getElementById('TEN_DD').value;
            if (!name) return alert("Vui lòng nhập tên địa điểm!");

            const payload = {
                TEN_DD: name,
                DIA_CHI: document.getElementById('DIA_CHI').value,
                LOAI_DD: document.getElementById('LOAI_DD').value,
                LAYOUT_DATA: document.getElementById('LOAI_DD').value === 'FIXED_SEAT' ? currentMasterLayout : zonePolygons
            };

            console.log("Dữ liệu gửi lên server:", payload);
            alert(`✅ Đã lưu địa điểm "${name}" thành công!`);

            builderScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
            loadLocationDataFromAPI(); // Refresh table
        });
    }

    // Kích hoạt
    init();
})();