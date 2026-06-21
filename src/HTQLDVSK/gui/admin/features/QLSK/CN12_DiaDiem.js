(() => {
    let allLocationData = [];
    let currentLocationData = [];
    let currentLocationPage = 1;
    const rowsPerLocationPage = 10;

    // --- State dùng cho Cấu hình Layout (CHỈ DÙNG CHO THÊM MỚI) ---
    let currentMasterLayout = [];
    let isDeletingMode = false;
    let currentBackgroundImage = null;
    let zonePolygons = [];

    // State Vẽ Shapes
    let activeZoneTool = null;
    let isDrawingShape = false;
    let shapeStartPoint = null;
    let currentMousePos = null;
    let currentPolygon = [];
    let isDeletingPolygonMode = false;

    // State Wizard
    let maxStepReached = 1;

    let currentSearchKeyword = '';

    function init() {
        if (!window.hasPermission(12, 'THEM')) {
            const addBtn = document.getElementById('btn-open-add-location');
            if (addBtn) addBtn.style.display = 'none';
        }

        loadLocationDataFromAPI();
        setupSearch();
        setupLocationBuilderEvents();
        setupEditModalEvents();
    }

    async function loadLocationDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/dia-diem');
            if (!response.ok) throw new Error("Lỗi tải API địa điểm");
            allLocationData = await response.json();
        } catch (error) {
            console.error("Dùng dữ liệu SQL giả định do API lỗi:", error);
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

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">Không tìm thấy địa điểm.</td></tr>`;
            renderLocationPagination();
            return;
        }

        pageData.forEach(dd => {
            const tr = document.createElement('tr');

            const tdId = document.createElement('td');
            const bId = document.createElement('b');
            bId.textContent = `${dd.MA_DD.toString().padStart(3, '0')}`;
            tdId.appendChild(bId);

            const tdName = document.createElement('td');
            const strongName = document.createElement('strong');
            strongName.style.color = '#262532';
            strongName.textContent = dd.TEN_DD;
            tdName.appendChild(strongName);

            const tdAddress = document.createElement('td');
            tdAddress.textContent = dd.DIA_CHI;

            const tdSize = document.createElement('td');
            tdSize.textContent = dd.LOAI_DD === 'FIXED_SEAT' ? `${dd.TONG_SO_COT || '-'} x ${dd.TONG_SO_HANG || '-'}` : 'Khu vực tự do';

            const tdActions = document.createElement('td');
            tdActions.className = 'actions';

            if (window.hasPermission(12, 'SUA')) {
                const iconEdit = document.createElement('img');
                iconEdit.src = '/img/EDIT.png';
                iconEdit.alt = 'Sửa';
                iconEdit.className = 'action-icon';
                iconEdit.title = 'Xem chi tiết / Chỉnh sửa';
                iconEdit.addEventListener('click', () => showLocationDetailView(dd));
                tdActions.appendChild(iconEdit);
            }

            if (window.hasPermission(12, 'XOA')) {
                const iconDelete = document.createElement('img');
                iconDelete.src = '/img/DELETE.png';
                iconDelete.alt = 'Xóa';
                iconDelete.className = 'action-icon';
                iconDelete.title = 'Xóa địa điểm';
                iconDelete.addEventListener('click', () => deleteLocation(dd));
                tdActions.appendChild(iconDelete);
            }

            tr.append(tdId, tdName, tdAddress, tdSize, tdActions);
            tbody.appendChild(tr);
        });

        renderLocationPagination();
    }

    function renderLocationPagination() {
        const paginationContainer = document.getElementById('location-pagination');
        if (!paginationContainer) return;
        const totalPages = Math.max(1, Math.ceil(currentLocationData.length / rowsPerLocationPage));
        paginationContainer.setAttribute('total-pages', totalPages);
        paginationContainer.setAttribute('current-page', currentLocationPage);
    }

    function setupSearch() {
        // [Đoạn setup search không đổi - Giữ nguyên như bản trước]
        const filterCity = document.getElementById('filter-city');
        const filterType = document.getElementById('filter-type');
        const filterStatus = document.getElementById('filter-status');

        function applyAllFilters() {
            const cityVal = filterCity ? filterCity.value : '';
            const typeVal = filterType ? filterType.value : '';
            const statusVal = filterStatus ? filterStatus.value : '';

            currentLocationData = allLocationData.filter(loc => {
                let matchKeyword = true;
                if (currentSearchKeyword) {
                    matchKeyword = (loc.TEN_DD && loc.TEN_DD.toLowerCase().includes(currentSearchKeyword)) ||
                                   (loc.DIA_CHI && loc.DIA_CHI.toLowerCase().includes(currentSearchKeyword));
                }
                let matchCity = true;
                if (cityVal) matchCity = loc.DIA_CHI && loc.DIA_CHI.includes(cityVal);
                let matchType = true;
                if (typeVal) matchType = ((loc.LOAI_DD || 'FIXED_SEAT') === typeVal);
                let matchStatus = true;
                if (statusVal !== '') {
                    const isConfigured = loc.LAYOUT_DATA && loc.LAYOUT_DATA !== '[]' && loc.LAYOUT_DATA !== 'null';
                    if (statusVal === '1') matchStatus = isConfigured;
                    if (statusVal === '0') matchStatus = !isConfigured;
                }
                return matchKeyword && matchCity && matchType && matchStatus;
            });
            currentLocationPage = 1;
            renderLocationTable();
        }

        document.addEventListener('search-changed', (e) => {
            currentSearchKeyword = e.detail.value.toLowerCase().trim();
            applyAllFilters();
        });

        [filterCity, filterType, filterStatus].forEach(el => {
            if (el) el.addEventListener('change', applyAllFilters);
        });

        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'location-pagination') {
                currentLocationPage = e.detail.page;
                renderLocationTable();
            }
        });
    }

    // ==========================================
    // SÂN KHẤU & RENDER CANVAS
    // ==========================================
    function drawStage(ctx, canvasWidth) {
        ctx.save();
        ctx.fillStyle = '#2c3e50';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(canvasWidth / 2 - 250, 20, 500, 60, 10);
        else ctx.rect(canvasWidth / 2 - 250, 20, 500, 60);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎤 KHU VỰC SÂN KHẤU (STAGE)', canvasWidth / 2, 50);
        ctx.restore();
    }

    // Hàm render canvas LÚC BUILD (Thêm mới)
    function renderMasterCanvas() {
        const canvas = document.getElementById('masterLayoutCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawStage(ctx, canvas.width);

        if (currentBackgroundImage) {
            ctx.drawImage(currentBackgroundImage, 0, 100, canvas.width, canvas.height - 100);
        }

        const currentType = document.getElementById('LOAI_DD').value;

        if (currentType === 'FIXED_SEAT') {
            currentMasterLayout.forEach(seat => {
                ctx.beginPath();
                ctx.arc(seat.x, seat.y, 14, 0, 2 * Math.PI);
                let color = '#7CCDFF';
                if (seat.LOAI_GHE === 'BLOCKED') color = '#ccc';
                else if (seat.LOAI_GHE === 'ACCESSIBLE') color = '#f1c40f';
                ctx.fillStyle = color; ctx.fill();
                ctx.lineWidth = 1; ctx.strokeStyle = '#100F1A'; ctx.stroke();
                ctx.fillStyle = '#100F1A'; ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(seat.label || '', seat.x, seat.y);
            });
        } else if (currentType === 'ZONE_BASED') {
            zonePolygons.forEach(poly => {
                if(!poly.points || poly.points.length === 0) return;
                ctx.beginPath();
                ctx.moveTo(poly.points[0].x, poly.points[0].y);
                for(let i=1; i<poly.points.length; i++) ctx.lineTo(poly.points[i].x, poly.points[i].y);
                ctx.closePath();

                ctx.fillStyle = 'rgba(155, 89, 182, 0.4)';
                ctx.fill();
                ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#100F1A'; ctx.font = 'bold 16px Arial';
                ctx.fillText(`${poly.name} (${poly.capacity} người)`, poly.points[0].x, poly.points[0].y - 10);
            });

            if (isDrawingShape && shapeStartPoint && currentMousePos) {
                ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath();
                if (activeZoneTool === 'rect') {
                    ctx.rect(shapeStartPoint.x, shapeStartPoint.y, currentMousePos.x - shapeStartPoint.x, currentMousePos.y - shapeStartPoint.y);
                } else if (activeZoneTool === 'circle') {
                    const r = Math.hypot(currentMousePos.x - shapeStartPoint.x, currentMousePos.y - shapeStartPoint.y);
                    ctx.arc(shapeStartPoint.x, shapeStartPoint.y, r, 0, Math.PI * 2);
                }
                ctx.stroke(); ctx.setLineDash([]);
            }

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

    // ==========================================
    // LUỒNG WIZARD (CHỈ DÀNH CHO THÊM MỚI)
    // ==========================================
    function goToLocStep(stepNum) {
        if (stepNum > maxStepReached) {
            window.Toast.warning("Vui lòng hoàn thành bước hiện tại trước khi chuyển trang!");
            return;
        }

        document.querySelectorAll('.loc-step-content').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.loc-step-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = '#888';
        });

        if (stepNum === 1) document.getElementById('loc-step-1').style.display = 'flex';
        if (stepNum === 2) {
            document.getElementById('loc-step-2').style.display = 'flex';
            setTimeout(renderMasterCanvas, 50);
        }
        if (stepNum === 3) {
            document.getElementById('loc-step-3').style.display = 'flex';
            document.getElementById('summary-name').textContent = document.getElementById('TEN_DD').value;
            document.getElementById('summary-address').textContent = document.getElementById('DIA_CHI').value;
            document.getElementById('summary-type').textContent = document.getElementById('LOAI_DD').value === 'FIXED_SEAT' ? 'Ghế cố định (Nhà hát)' : 'Khu vực tự do (Zone)';
        }

        const activeBtn = document.querySelector(`.loc-step-btn[data-step="${stepNum}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.borderBottomColor = '#7CCDFF';
            activeBtn.style.color = '#262532';
        }
    }

    function setupLocationBuilderEvents() {
        const builderScreen = document.getElementById('location-builder-fullscreen');
        const selectType = document.getElementById('LOAI_DD');
        const canvas = document.getElementById('masterLayoutCanvas');

        // CHỈ SỬ DỤNG CHO THÊM MỚI
        document.getElementById('btn-open-add-location')?.addEventListener('click', () => {
            maxStepReached = 1;
            document.getElementById('TEN_DD').value = '';
            document.getElementById('DIA_CHI').value = '';
            document.getElementById('LOAI_DD').value = 'FIXED_SEAT';
            document.getElementById('preview-loc-name').textContent = 'Chưa đặt tên';

            currentMasterLayout = [];
            zonePolygons = [];
            activeZoneTool = null;
            currentBackgroundImage = null;

            if(canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            goToLocStep(1);
            builderScreen.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });

        document.querySelectorAll('.loc-step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => goToLocStep(parseInt(e.target.dataset.step)));
        });

        document.getElementById('btn-next-step-2')?.addEventListener('click', () => {
            const ten = document.getElementById('TEN_DD').value.trim();
            const diachi = document.getElementById('DIA_CHI').value.trim();
            if(!ten || !diachi) {
                window.Toast.warning('Vui lòng nhập Tên và Địa chỉ trước khi sang bước 2!');
                return;
            }
            maxStepReached = Math.max(maxStepReached, 2);
            goToLocStep(2);
        });

        document.getElementById('btn-next-step-3')?.addEventListener('click', () => {
            const type = document.getElementById('LOAI_DD').value;
            if (type === 'FIXED_SEAT' && currentMasterLayout.length === 0) {
                window.Toast.warning("Vui lòng sinh sơ đồ lưới ít nhất một lần!");
                return;
            }
            if (type === 'ZONE_BASED' && zonePolygons.length === 0) {
                window.Toast.warning("Vui lòng vẽ ít nhất một khu vực!");
                return;
            }
            maxStepReached = Math.max(maxStepReached, 3);
            goToLocStep(3);
        });

        document.getElementById('btn-back-step-1')?.addEventListener('click', () => goToLocStep(1));
        document.getElementById('btn-back-step-2')?.addEventListener('click', () => goToLocStep(2));
        document.getElementById('close-location-builder')?.addEventListener('click', () => {
            builderScreen.style.display = 'none'; document.body.style.overflow = 'auto';
        });

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

        document.getElementById('TEN_DD').addEventListener('input', (e) => {
            document.getElementById('preview-loc-name').textContent = e.target.value || 'Chưa đặt tên';
        });

        // --- CÁC HÀM XỬ LÝ VẼ SƠ ĐỒ Ở BƯỚC 2 (GIỮ NGUYÊN BẢN CŨ CỦA BẠN) ---
        document.getElementById('btn-generate-matrix')?.addEventListener('click', () => {
            const cols = parseInt(document.getElementById('TONG_SO_COT').value) || 30;
            const rows = parseInt(document.getElementById('TONG_SO_HANG').value) || 20;

            canvas.width = Math.max(1000, cols * 40 + 100);
            canvas.height = Math.max(800, rows * 40 + 200);
            currentMasterLayout = [];

            const startX = 60, startY = 130;
            for (let r = 0; r < rows; r++) {
                let rowLabel = String.fromCharCode(65 + (r % 26));
                if (r >= 26) rowLabel = 'A' + String.fromCharCode(65 + (r % 26));
                for (let c = 0; c < cols; c++) {
                    currentMasterLayout.push({ label: `${rowLabel}${c + 1}`, x: startX + c * 40, y: startY + r * 40, LOAI_GHE: 'NORMAL' });
                }
            }
            renderMasterCanvas();
        });

        const btnToggleEdit = document.getElementById('btn-toggle-seat-edit');
        btnToggleEdit?.addEventListener('click', () => {
            isDeletingMode = !isDeletingMode;
            btnToggleEdit.style.background = isDeletingMode ? '#e74c3c' : 'transparent';
            btnToggleEdit.style.color = isDeletingMode ? 'white' : '#e74c3c';
            btnToggleEdit.textContent = isDeletingMode ? '✅ Đang bật chế độ Sửa' : '🖍️ Bật cọ Thêm/Xóa ghế';
        });

        const setZoneTool = (toolId, btnEl) => {
            activeZoneTool = toolId;
            isDeletingPolygonMode = false;
            currentPolygon = [];
            isDrawingShape = false;

            document.querySelectorAll('.zone-tool-btn').forEach(b => {
                b.style.background = 'white'; b.style.borderColor = '#ccc';
            });
            if (btnEl) {
                btnEl.style.background = '#e9f7ef'; btnEl.style.borderColor = '#27ae60';
            }

            const btnFinish = document.getElementById('btn-finish-polygon');
            btnFinish.style.display = (toolId === 'poly') ? 'block' : 'none';
            canvas.style.cursor = toolId ? 'crosshair' : 'default';
        };

        document.getElementById('btn-tool-rect')?.addEventListener('click', (e) => setZoneTool('rect', e.currentTarget));
        document.getElementById('btn-tool-circle')?.addEventListener('click', (e) => setZoneTool('circle', e.currentTarget));
        document.getElementById('btn-tool-poly')?.addEventListener('click', (e) => setZoneTool('poly', e.currentTarget));

        document.getElementById('btn-finish-polygon')?.addEventListener('click', () => {
            if (currentPolygon.length >= 3) {
                const zoneName = prompt("Nhập tên cho Khu vực này (VD: Fanzone A):");
                const capacity = prompt("Nhập sức chứa tối đa của khu vực này (Số vé):", "1000");
                if (zoneName && capacity) zonePolygons.push({ points: [...currentPolygon], name: zoneName, capacity: capacity });
            } else {
                window.Toast.warning("Vùng đa giác tự do phải có ít nhất 3 điểm!");
            }
            setZoneTool(null, null);
            renderMasterCanvas();
        });

        document.getElementById('btn-delete-polygon')?.addEventListener('click', () => {
            setZoneTool(null, null);
            isDeletingPolygonMode = !isDeletingPolygonMode;
            const btnDel = document.getElementById('btn-delete-polygon');
            btnDel.style.background = isDeletingPolygonMode ? '#e74c3c' : 'transparent';
            btnDel.style.color = isDeletingPolygonMode ? 'white' : '#e74c3c';
            btnDel.textContent = isDeletingPolygonMode ? '✅ Đang bật Xóa vùng' : '🗑️ Bật cọ Xóa Khu vực';
        });

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const type = document.getElementById('LOAI_DD').value;

            if (type === 'FIXED_SEAT' && isDeletingMode && e.button === 0) {
                const index = currentMasterLayout.findIndex(seat => Math.sqrt(Math.pow(seat.x - x, 2) + Math.pow(seat.y - y, 2)) <= 15);
                if (index !== -1) {
                    currentMasterLayout.splice(index, 1);
                } else {
                    const snapX = Math.round(x / 40) * 40;
                    const snapY = Math.round(y / 40) * 40;
                    if (snapX > 0 && snapY > 0) {
                        const rowIndex = Math.round((snapY - 130) / 40);
                        let rowLabel = String.fromCharCode(65 + (rowIndex % 26));
                        const colIndex = Math.round((snapX - 60) / 40) + 1;
                        currentMasterLayout.push({ label: `${rowLabel}${colIndex}`, x: snapX, y: snapY, LOAI_GHE: 'NORMAL' });
                    }
                }
                renderMasterCanvas();
            }
            else if (type === 'ZONE_BASED' && e.button === 0) {
                if (activeZoneTool === 'poly') {
                    currentPolygon.push({x, y});
                    renderMasterCanvas();
                } else if (activeZoneTool === 'rect' || activeZoneTool === 'circle') {
                    shapeStartPoint = {x, y};
                    isDrawingShape = true;
                } else if (isDeletingPolygonMode) {
                    const ctx = canvas.getContext('2d');
                    for (let i = zonePolygons.length - 1; i >= 0; i--) {
                        const path = new Path2D();
                        const pts = zonePolygons[i].points;
                        if(pts && pts.length > 0) {
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
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawingShape && shapeStartPoint) {
                const rect = canvas.getBoundingClientRect();
                currentMousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                renderMasterCanvas();
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDrawingShape && shapeStartPoint && currentMousePos) {
                isDrawingShape = false;
                let points = [];

                if (activeZoneTool === 'rect') {
                    const w = currentMousePos.x - shapeStartPoint.x, h = currentMousePos.y - shapeStartPoint.y;
                    if (Math.abs(w) > 10 && Math.abs(h) > 10) {
                        points = [
                            {x: shapeStartPoint.x, y: shapeStartPoint.y},
                            {x: shapeStartPoint.x + w, y: shapeStartPoint.y},
                            {x: shapeStartPoint.x + w, y: shapeStartPoint.y + h},
                            {x: shapeStartPoint.x, y: shapeStartPoint.y + h}
                        ];
                    }
                } else if (activeZoneTool === 'circle') {
                    const r = Math.hypot(currentMousePos.x - shapeStartPoint.x, currentMousePos.y - shapeStartPoint.y);
                    if (r > 10) {
                        for (let i = 0; i < 30; i++) {
                            const angle = (i / 30) * Math.PI * 2;
                            points.push({ x: shapeStartPoint.x + r * Math.cos(angle), y: shapeStartPoint.y + r * Math.sin(angle) });
                        }
                    }
                }

                if (points.length > 0) {
                    const zoneName = prompt("Nhập tên cho Khu vực này (VD: VIP Zone):");
                    const capacity = prompt("Nhập sức chứa tối đa (Số vé):", "1000");
                    if (zoneName && capacity) zonePolygons.push({ points: points, name: zoneName, capacity: parseInt(capacity) });
                }

                shapeStartPoint = null; currentMousePos = null;
                setZoneTool(null, null);
                renderMasterCanvas();
            }
        });

        // XONG BƯỚC 3 LƯU LẠI
        document.getElementById('save-location-btn')?.addEventListener('click', async () => {
            const name = document.getElementById('TEN_DD')?.value;
            const typeDD = document.getElementById('LOAI_DD')?.value;

            if (!name) return window.Toast.warning("Vui lòng nhập tên địa điểm!");

            // Lấy giá trị an toàn bằng ?. (Tránh crash null.value)
            const soCot = parseInt(document.getElementById('TONG_SO_COT')?.value || 0);
            const soHang = parseInt(document.getElementById('TONG_SO_HANG')?.value || 0);
            const sucChua = parseInt(document.getElementById('SUC_CHUA_TONG')?.value || 0);

            // Đóng gói Payload CHUẨN để đẩy xuống Backend
            const payload = {
                TEN_DD: name,
                DIA_CHI: document.getElementById('DIA_CHI')?.value || '',
                LOAI_DD: typeDD,
                TONG_SO_COT: typeDD === 'FIXED_SEAT' ? soCot : 0,
                TONG_SO_HANG: typeDD === 'FIXED_SEAT' ? soHang : 0,
                SUC_CHUA_TONG: typeDD === 'ZONE_BASED' ? sucChua : 0,
                LAYOUT_DATA: typeDD === 'FIXED_SEAT' ? currentMasterLayout : zonePolygons
            };

            try {
                // Gọi API POST tạo địa điểm
                const response = await fetch('http://localhost:8000/api/dia-diem', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    window.Toast.success(`Đã lưu địa điểm "${name}" thành công!`);

                    const builderScreen = document.getElementById('location-builder-fullscreen');
                    builderScreen.style.display = 'none';
                    document.body.style.overflow = 'auto';

                    loadLocationDataFromAPI(); // Cập nhật lại bảng
                } else {
                    window.Toast.error(result.error || "Có lỗi khi lưu địa điểm");
                }
            } catch (err) {
                window.Toast.error("Không thể kết nối đến máy chủ.");
            }
        });
    }

    // ==========================================
    // CÁC HÀM XEM CHI TIẾT & CHỈNH SỬA (MỚI)
    // ==========================================
    async function showLocationDetailView(loc) {
        const detailModal = document.getElementById('location-detail-modal');

        document.getElementById('detail-view-name').textContent = loc.TEN_DD;
        document.getElementById('detail-view-address').textContent = loc.DIA_CHI;

        const typeEl = document.getElementById('detail-view-type');
        if (loc.LOAI_DD === 'FIXED_SEAT') {
            typeEl.textContent = 'Ghế cố định'; typeEl.style.backgroundColor = '#3498db';
            document.getElementById('detail-view-size-lbl').textContent = 'Lưới (Cột × Hàng):';
            document.getElementById('detail-view-size').textContent = `${loc.TONG_SO_COT || '-'} × ${loc.TONG_SO_HANG || '-'}`;
        } else {
            typeEl.textContent = 'Khu vực tự do'; typeEl.style.backgroundColor = '#9b59b6';
            document.getElementById('detail-view-size-lbl').textContent = 'Quy mô vùng:';
            document.getElementById('detail-view-size').textContent = 'Tùy biến Polygon';
        }

        const statusEl = document.getElementById('detail-view-status');
        if (loc.TRANG_THAI == 1 || loc.TRANG_THAI === undefined) {
            statusEl.textContent = '🟢 Hoạt động'; statusEl.style.color = '#28a745';
        } else {
            statusEl.textContent = '🔴 Tạm ẩn'; statusEl.style.color = '#dc3545';
        }

        let layoutData = [];
        try { layoutData = loc.LAYOUT_DATA ? (typeof loc.LAYOUT_DATA === 'string' ? JSON.parse(loc.LAYOUT_DATA) : loc.LAYOUT_DATA) : []; } catch(e) {}

        // TÍNH TOÁN SỨC CHỨA THEO CHUẨN MỚI
        let capacity = 0;
        let actualType = loc.LOAI_DD;
        // Bắt lỗi dữ liệu Sân Mỹ Đình (ZONE_BASED nhưng chứa mảng ghế cố định)
        if (layoutData.length > 0 && layoutData[0].x !== undefined && layoutData[0].points === undefined) {
            actualType = 'FIXED_SEAT';
        }

        if (actualType === 'FIXED_SEAT') {
            capacity = layoutData.filter(s => s.LOAI_GHE !== 'BLOCKED').length;
        } else {
            capacity = loc.SUC_CHUA_TONG || 0;
        }
        document.getElementById('detail-view-capacity').textContent = `${capacity.toLocaleString()} ghế (có thể bán)`;

        const realEvents = await fetchRealEventsByLocation(loc.MA_DD);
        document.getElementById('detail-view-event-count').textContent = realEvents.length;

        const ulEvents = document.getElementById('detail-view-recent-events');
        ulEvents.replaceChildren();
        if (realEvents.length === 0) {
            ulEvents.innerHTML = '<li style="color:#888; font-style:italic;">Chưa có sự kiện nào tổ chức tại đây.</li>';
        } else {
            realEvents.slice(0, 7).forEach(evt => {
                const li = document.createElement('li');
                li.style.cssText = "padding: 10px; background: white; border: 1px solid #eee; border-radius: 6px; font-size: 13px; display: flex; justify-content: space-between; align-items: center;";
                li.innerHTML = `<strong style="color: #262532;">${evt.TEN_SK}</strong><span style="color: #666; font-size: 11px;">${evt.TG_BAT_DAU ? evt.TG_BAT_DAU.substring(0, 10) : ''}</span>`;
                ulEvents.appendChild(li);
            });
        }

        // Gọi hàm Render hỗ trợ Data sai
        renderDetailCanvasSafe(actualType, layoutData);

        detailModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        document.getElementById('btn-open-edit-builder').onclick = () => {
            openEditLocationModal(loc); // KÍCH HOẠT HỘP THOẠI CHỈNH SỬA MỚI
        };
        document.getElementById('close-detail-view').onclick = () => {
            detailModal.style.display = 'none'; document.body.style.overflow = 'auto';
        };
    }

    // THUẬT TOÁN RENDER CANVAS AN TOÀN (CHỐNG LỖI DB MỸ ĐÌNH)
    function renderDetailCanvasSafe(actualType, layoutData) {
        const canvas = document.getElementById('detailLayoutCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawStage(ctx, canvas.width);
        if (!Array.isArray(layoutData)) return;

        if (actualType === 'FIXED_SEAT') {
            layoutData.forEach(seat => {
                if (seat.x === undefined || seat.y === undefined) return;
                ctx.beginPath(); ctx.arc(seat.x, seat.y, 14, 0, 2 * Math.PI);
                ctx.fillStyle = seat.LOAI_GHE === 'BLOCKED' ? '#ccc' : (seat.LOAI_GHE === 'ACCESSIBLE' ? '#f1c40f' : '#7CCDFF');
                ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#100F1A'; ctx.stroke();
                ctx.fillStyle = '#100F1A'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(seat.label || '', seat.x, seat.y);
            });
        } else {
            layoutData.forEach(poly => {
                if (!poly.points || !Array.isArray(poly.points) || poly.points.length === 0) return;
                ctx.beginPath(); ctx.moveTo(poly.points[0].x, poly.points[0].y);
                for(let i=1; i<poly.points.length; i++) ctx.lineTo(poly.points[i].x, poly.points[i].y);
                ctx.closePath();
                ctx.fillStyle = 'rgba(155, 89, 182, 0.4)'; ctx.fill();
                ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#100F1A'; ctx.font = 'bold 16px Arial';
                ctx.fillText(`${poly.name || 'Khu'} (${poly.capacity || 0} chỗ)`, poly.points[0].x, poly.points[0].y - 10);
            });
        }
    }

    // MODAL CHỈNH SỬA THÔNG TIN ĐỘC LẬP
    function setupEditModalEvents() {
        document.getElementById('close-edit-location')?.addEventListener('click', () => {
            document.getElementById('edit-location-modal').style.display = 'none';
        });
        document.getElementById('btn-cancel-edit-loc')?.addEventListener('click', () => {
            document.getElementById('edit-location-modal').style.display = 'none';
        });
    }

    function openEditLocationModal(loc) {
        document.getElementById('edit-location-modal').style.display = 'flex';
        document.getElementById('EDIT_TEN_DD').value = loc.TEN_DD || '';
        document.getElementById('EDIT_DIA_CHI').value = loc.DIA_CHI || '';

        const capGroup = document.getElementById('edit-capacity-group');
        if (loc.LOAI_DD === 'ZONE_BASED') {
            capGroup.style.display = 'block';
            document.getElementById('EDIT_SUC_CHUA_TONG').value = loc.SUC_CHUA_TONG || 0;
        } else {
            capGroup.style.display = 'none';
        }

        const btnSave = document.getElementById('btn-save-edit-loc');
        btnSave.onclick = async () => {
            const ten = document.getElementById('EDIT_TEN_DD').value.trim();
            const dc = document.getElementById('EDIT_DIA_CHI').value.trim();
            if (!ten || !dc) return window.Toast.warning("Vui lòng nhập đủ Tên và Địa chỉ!");

            // Payload giả lập API
            loc.TEN_DD = ten;
            loc.DIA_CHI = dc;
            if (loc.LOAI_DD === 'ZONE_BASED') loc.SUC_CHUA_TONG = parseInt(document.getElementById('EDIT_SUC_CHUA_TONG').value) || 0;

            window.Toast.success("Đã cập nhật thông tin địa điểm!");
            document.getElementById('edit-location-modal').style.display = 'none';
            renderLocationTable();

            // Sửa luôn UI bảng Detail
            document.getElementById('detail-view-name').textContent = loc.TEN_DD;
            document.getElementById('detail-view-address').textContent = loc.DIA_CHI;
            if (loc.LOAI_DD === 'ZONE_BASED') document.getElementById('detail-view-capacity').textContent = `${loc.SUC_CHUA_TONG.toLocaleString()} ghế (có thể bán)`;
        };
    }

    // LOGIC TẢI DATA EVENT THẬT
    async function fetchRealEventsByLocation(maDD) {
        try {
            const response = await fetch('http://localhost:8000/api/su-kien');
            if (!response.ok) return [];
            const allEvts = await response.json();
            return allEvts.filter(e => e.MA_DD == maDD);
        } catch (error) {
            return [];
        }
    }

    async function deleteLocation(loc) {
        window.ConfirmModal.show({
            title: 'Yêu cầu Xóa Địa Điểm',
            message: `Bạn đang thao tác xóa địa điểm <b>"${loc.TEN_DD}"</b>.<br><br>Hệ thống sẽ tự động:<br>• <b>Xóa cứng (Vĩnh viễn)</b> nếu địa điểm chưa có sự kiện.<br>• <b>Xóa mềm (Ẩn đi)</b> nếu địa điểm đã được sử dụng để bảo vệ dữ liệu lịch sử.<br><br>Bạn có muốn tiếp tục?`,
            okText: '🗑️ Xóa Ngay',
            okColor: '#e74c3c',
            onConfirm: async () => {
                try {
                    const response = await fetch(`http://localhost:8000/api/dia-diem/${loc.MA_DD}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();

                    if (response.ok && result.success) {
                        // Loại bỏ khỏi UI
                        allLocationData = allLocationData.filter(d => d.MA_DD !== loc.MA_DD);
                        const filterCity = document.getElementById('filter-city');
                        if (filterCity) filterCity.dispatchEvent(new Event('change'));

                        // Hiển thị Toast tùy theo kết quả Server trả về
                        if(result.type === "HARD") window.Toast.success(`XÓA CỨNG: ${result.message}`);
                        else window.Toast.info(`XÓA MỀM: ${result.message}`);
                    } else {
                        window.Toast.error(`❌ LỖI: ${result.error || 'Thao tác thất bại'}`);
                    }
                } catch (error) {
                    window.Toast.error("Không thể kết nối đến máy chủ để xóa địa điểm!");
                }
            }
        });
    }

    init();
})();