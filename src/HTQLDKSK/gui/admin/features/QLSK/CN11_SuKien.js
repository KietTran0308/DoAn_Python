(() => {
    // === TẠO VÙNG NHỚ ĐỘC LẬP CHO TAB SỰ KIỆN ===
    let currentEventData = [];
    let currentEventPage = 1;
    const rowsPerEventPage = 10;

    let allEventData = [];
    let allLocationsCache = [];

    let builder_dsHangGhe = [];
    let builder_dsKhuVuc = [];

    let currentSearchKeyword = '';

    let builder_layoutSeats = []; // Mảng chứa ghế copy từ Địa Điểm
    let isPainting = false;

    let edit_layoutSeats = [];
    let edit_dsHangGhe = [];
    let isEditPainting = false;

    // Khởi chạy
    function init() {
        loadEventDataFromAPI();
        loadLocationsForDropdown();
        loadCategoriesForDropdown();
        setupAddEventModal();
        setupTicketBuilderEvents();
        setupSearch();
        setupEditModalEvents();
    }

    async function loadLocationsForDropdown() {
        const selectDD = document.getElementById('MA_DD');
        if (!selectDD) return;

        try {
            const response = await fetch('http://localhost:8000/api/dia-diem');
            if (response.ok) {
                allLocationsCache = await response.json(); // LƯU VÀO CACHE

                selectDD.innerHTML = '<option value="">-- Chọn địa điểm --</option>';
                allLocationsCache.forEach(loc => {
                    const option = document.createElement('option');
                    option.value = loc.MA_DD;
                    option.textContent = `${loc.TEN_DD} (${loc.DIA_CHI})`;
                    selectDD.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách địa điểm:", error);
        }
    }

    async function loadCategoriesForDropdown() {
        const selectDM = document.getElementById('MA_DMSK');
        const filterCategory = document.getElementById('filter-category'); // Lấy Select bộ lọc

        try {
            const response = await fetch('http://localhost:8000/api/danh-muc-su-kien');
            if (!response.ok) throw new Error("Lỗi API danh mục");
            const categories = await response.json();

            if (selectDM) selectDM.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            if (filterCategory) filterCategory.innerHTML = '<option value="">Tất cả danh mục</option>';

            categories.forEach(c => {
                if (selectDM) {
                    const opt1 = document.createElement('option');
                    opt1.value = c.MA_DMSK;
                    opt1.textContent = c.TEN_DM;
                    selectDM.appendChild(opt1);
                }
                if (filterCategory) {
                    const opt2 = document.createElement('option');
                    opt2.value = c.TEN_DM; // Dùng tên để so sánh với TEN_DM trong bảng sự kiện
                    opt2.textContent = c.TEN_DM;
                    filterCategory.appendChild(opt2);
                }
            });
        } catch (error) {
            console.warn("Đang dùng dữ liệu danh mục dự phòng do lỗi API:", error);
            const mockCategories = [
                {MA_DMSK: 1, TEN_DM: 'Âm nhạc & Giải trí'},
                {MA_DMSK: 2, TEN_DM: 'Thể thao & E-Sports'},
                {MA_DMSK: 3, TEN_DM: 'Giáo dục & Công nghệ'},
                {MA_DMSK: 4, TEN_DM: 'Sân khấu & Nghệ thuật'},
                {MA_DMSK: 5, TEN_DM: 'Văn hóa & Triển lãm'}
            ];

            if (selectDM) selectDM.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            if (filterCategory) filterCategory.innerHTML = '<option value="">Tất cả danh mục</option>';

            mockCategories.forEach(c => {
                if (selectDM) {
                    const opt1 = document.createElement('option');
                    opt1.value = c.MA_DMSK;
                    opt1.textContent = c.TEN_DM;
                    selectDM.appendChild(opt1);
                }
                if (filterCategory) {
                    const opt2 = document.createElement('option');
                    opt2.value = c.TEN_DM;
                    opt2.textContent = c.TEN_DM;
                    filterCategory.appendChild(opt2);
                }
            });
        }
        const pendingFilter = sessionStorage.getItem('pendingCategoryFilter');
        if (pendingFilter && filterCategory) {
            filterCategory.value = pendingFilter;
            sessionStorage.removeItem('pendingCategoryFilter');

            setTimeout(() => filterCategory.dispatchEvent(new Event('change')), 100);
        }
    }

    async function loadEventDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/su-kien');
            if (!response.ok) throw new Error("Lỗi tải API sự kiện");
            allEventData = await response.json();
        } catch (error) {
            console.error("Dùng dữ liệu giả định do lỗi API:", error);
        }
        currentEventData = [...allEventData];
        currentEventPage = 1;
        renderEventTable();
    }

    function renderEventTable() {
        const tbody = document.getElementById('event-table-body');
        if (!tbody) return;

        tbody.replaceChildren();
        const startIndex = (currentEventPage - 1) * rowsPerEventPage;
        const pageData = currentEventData.slice(startIndex, startIndex + rowsPerEventPage);

        pageData.forEach(sk => {
            const tr = document.createElement('tr');

            const dateObj = new Date(sk.TG_BAT_DAU);
            const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')} / ${(dateObj.getMonth() + 1).toString().padStart(2, '0')} / ${dateObj.getFullYear()} - ${dateObj.getHours()}h${dateObj.getMinutes().toString().padStart(2, '0')}`;

            const tdName = document.createElement('td');
            const strong = document.createElement('strong');
            strong.textContent = sk.TEN_SK;
            const br = document.createElement('br');
            const small = document.createElement('small');
            small.textContent = `${sk.MA_SK.toString().padStart(3, '0')} - ${sk.TEN_DM}`;
            tdName.append(strong, br, small);

            const tdDate = document.createElement('td');
            tdDate.textContent = formattedDate;

            const tdLoc = document.createElement('td');
            tdLoc.textContent = sk.TEN_DD;

            const tdTickets = document.createElement('td');
            tdTickets.textContent = sk.VE_DA_BAN;

            const tdStatus = document.createElement('td');
            tdStatus.textContent = sk.TRANG_THAI === 1 ? 'Đang bán' : 'Đã khóa';

            const tdActions = document.createElement('td');
            tdActions.classList.add('actions');

            const iconEdit = document.createElement('img');
            iconEdit.src = '/img/EDIT.png';
            iconEdit.alt = 'Sửa';
            iconEdit.classList.add('action-icon');
            iconEdit.addEventListener('click', () => openEditModal(sk));

            const iconLock = document.createElement('img');
            iconLock.src = '/img/LOCK.png';
            iconLock.alt = 'Khóa';
            iconLock.classList.add('action-icon');

            const iconDelete = document.createElement('img');
            iconDelete.src = '/img/DELETE.png';
            iconDelete.alt = 'Xóa';
            iconDelete.classList.add('action-icon');

            tdActions.append(iconEdit, iconLock, iconDelete);
            tr.append(tdName, tdDate, tdLoc, tdTickets, tdStatus, tdActions);
            tbody.appendChild(tr);
        });

        for (let i = 0; i < (rowsPerEventPage - pageData.length); i++) {
            const emptyTr = document.createElement('tr');
            for (let j = 0; j < 6; j++) {
                const td = document.createElement('td');
                if (j === 0) td.textContent = '\u00A0';
                emptyTr.appendChild(td);
            }
            tbody.appendChild(emptyTr);
        }
        renderEventPagination();
    }

    function renderEventPagination() {
        const paginationContainer = document.getElementById('event-pagination');
        if (!paginationContainer) return;

        const totalPages = Math.max(1, Math.ceil(currentEventData.length / rowsPerEventPage));

        // Truyền data vào Component. Component sẽ TỰ ĐỘNG VẼ GIAO DIỆN
        paginationContainer.setAttribute('total-pages', totalPages);
        paginationContainer.setAttribute('current-page', currentEventPage);
    }

    function setupAddEventModal() {
        const btnOpen = document.querySelector('.add-btn');
        const fsContainer = document.getElementById('add-event-fullscreen');
        const btnCancel = document.getElementById('btn-cancel-add-event');
        const btnSave = document.getElementById('btn-save-add-event'); // Lấy nút Lưu sự kiện
        const selectDD = document.getElementById('MA_DD');

        // Mở màn hình Fullscreen tạo sự kiện
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                document.getElementById('add-event-form').reset();
                fsContainer.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Khóa cuộn trang nền
                renderLocationPreview(""); // Xóa trắng Canvas xem trước
            });
        }

        // Đóng màn hình
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                fsContainer.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        // Lắng nghe khi Chọn Địa Điểm -> RENDER SƠ ĐỒ BÊN PHẢI (Xem trước)
        if (selectDD) {
            selectDD.addEventListener('change', (e) => {
                const locId = parseInt(e.target.value);
                renderLocationPreview(locId);
            });
        }

        // ==============================================================
        // LUỒNG MỚI: BẤM LƯU SỰ KIỆN -> TỰ ĐỘNG CHUYỂN SANG PHÂN HẠNG VÉ
        // ==============================================================
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                // 1. Lấy các giá trị trên form
                const tenSK = document.getElementById('TEN_SK').value.trim();
                const maDD = parseInt(document.getElementById('MA_DD').value);
                const maDMSK = document.getElementById('MA_DMSK').value;
                const tgBatDau = document.getElementById('TG_BAT_DAU').value;

                // 2. Validate form cơ bản
                if (!tenSK || !maDD || !maDMSK || !tgBatDau) {
                    alert('⚠️ Vui lòng nhập đầy đủ các trường bắt buộc (*) trước khi lưu!');
                    return;
                }

                /* 3. Tại đây sẽ gọi API POST để lưu sự kiện vào CSDL.
                   Sau khi lưu thành công, API sẽ trả về MA_SK (ID của sự kiện vừa tạo).
                   Tạm thời chúng ta sẽ giả lập ID này bằng Date.now()
                */
                const newMaSK = Date.now();

                // 4. Chuyển đổi màn hình (Wizard Flow)
                // Đóng màn hình tạo Sự kiện
                fsContainer.style.display = 'none';

                // Tự động kích hoạt màn hình Phân Hạng Vé và truyền đúng Địa điểm vừa chọn sang
                openTicketBuilder(newMaSK, tenSK, maDD);
            });
        }
    }

    function renderLocationPreview(locId) {
        const canvas = document.getElementById('locationPreviewCanvas');
        const ctx = canvas.getContext('2d');
        const msg = document.getElementById('no-location-msg');
        const locationNameEl = document.getElementById('preview-location-name');

        // Reset
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Nếu người dùng chọn lại option mặc định rỗng
        if (!locId) {
            canvas.style.display = 'none';
            msg.style.display = 'block';
            locationNameEl.textContent = "Chưa chọn";
            locationNameEl.style.color = "#C7C4D8";
            return;
        }

        // Tìm địa điểm trong cache
        const loc = allLocationsCache.find(l => l.MA_DD === locId);
        if (!loc) return;

        canvas.style.display = 'block';
        msg.style.display = 'none';
        locationNameEl.textContent = loc.TEN_DD;
        locationNameEl.style.color = "#1dd1a1";

        // Nếu là địa điểm FIXED_SEAT có chứa LAYOUT_DATA (ma trận ghế)
        if (loc.LAYOUT_DATA) {
            try {
                const layout = JSON.parse(loc.LAYOUT_DATA);

                // Trải các ghế lên Canvas
                layout.forEach(seat => {
                    ctx.beginPath();
                    ctx.arc(seat.x, seat.y, 14, 0, 2 * Math.PI);
                    ctx.fillStyle = '#e0e0e0'; // Màu ghế mẫu xám nhạt
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#262532';
                    ctx.stroke();

                    // Chữ A1, A2
                    ctx.fillStyle = '#262532';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(seat.label, seat.x, seat.y);
                });
            } catch (e) {
                console.error("Lỗi khi Parse LAYOUT_DATA:", e);
                ctx.font = "20px Arial";
                ctx.fillText("⚠️ Lỗi đọc dữ liệu Sơ đồ ghế.", 50, 50);
            }
        } else {
            // Trường hợp địa điểm dạng ZONE_BASED (chưa có ghế vật lý tĩnh)
            ctx.fillStyle = "#f8f9fa";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#666";
            ctx.font = "18px Arial";
            ctx.textAlign = 'center';
            ctx.fillText("Khu vực này dùng sơ đồ Zone-based (Phân khu tự do).", canvas.width / 2, canvas.height / 2);
            ctx.fillText("Bản đồ nền (Floor Plan) sẽ được hiển thị tại đây nếu đã tải lên.", canvas.width / 2, canvas.height / 2 + 30);
        }
    }

    function setupTicketBuilderEvents() {
        const workspace = document.getElementById('ticket-builder-fullscreen');
        const closeBtn = document.getElementById('close-builder-btn');
        const saveBtn = document.getElementById('save-builder-btn');
        const canvas = document.getElementById('seatMapCanvas');

        // Đóng giao diện
        if (closeBtn) closeBtn.addEventListener('click', () => {
            workspace.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        // 1. NÚT THÊM HẠNG VÉ
        const btnAddHg = document.getElementById('btn-add-hg');
        if (btnAddHg) {
            btnAddHg.addEventListener('click', () => {
                const ten = document.getElementById('TEN_HG').value.trim();
                const gia = document.getElementById('GIA_TIEN').value;
                const mau = document.getElementById('MAU_HG').value;

                if (!ten || !gia) return alert("Vui lòng nhập tên hạng và giá tiền!");

                builder_dsHangGhe.push({id: Date.now(), TEN_HG: ten, GIA_TIEN: parseInt(gia), COLOR: mau});

                document.getElementById('TEN_HG').value = '';
                document.getElementById('GIA_TIEN').value = '';
                renderHangGheList();
            });
        }

        // 2. LOGIC CỌ VẼ (KÉO THẢ CHUỘT TRÊN CANVAS)
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => {
                isPainting = true;
                paintSeat(e);
            });

            canvas.addEventListener('mousemove', (e) => {
                if (isPainting) paintSeat(e);
            });

            window.addEventListener('mouseup', () => {
                isPainting = false; // Nhả chuột -> Ngừng tô
            });
        }

        // 3. LƯU PHÂN HẠNG XUỐNG DB
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Kiểm tra xem đã thiết lập hạng vé chưa
                if (builder_dsHangGhe.length === 0) {
                    alert("⚠️ Vui lòng cấu hình ít nhất một Hạng vé trước khi tiếp tục!");
                    return;
                }

                // Kiểm tra xem đã tô màu ghế nào chưa (đối với FIXED_SEAT)
                const isFixedSeat = builder_layoutSeats.length > 0;
                const paintedSeats = builder_layoutSeats.filter(s => s.MA_HG !== null);
                if (isFixedSeat && paintedSeats.length === 0) {
                    alert("⚠️ Bạn chưa dùng cọ tô hạng vé cho bất kỳ ghế nào trên sơ đồ!");
                    return;
                }

                // Ẩn màn hình phân hạng vé
                workspace.style.display = 'none';

                // Kích hoạt màn hình Review tổng thể
                openEventReview();
            });
        }
    }

    function openEventReview() {
        const reviewScreen = document.getElementById('event-review-fullscreen');
        reviewScreen.style.display = 'flex';

        // 1. LẤY DỮ LIỆU TỪ FORM BƯỚC 1 ĐỂ IN LÊN GIAO DIỆN
        document.getElementById('lbl-review-title').textContent = document.getElementById('TEN_SK').value.trim();
        document.getElementById('lbl-review-desc').textContent = document.getElementById('MO_TA').value.trim() || "Không có mô tả.";

        const catSelect = document.getElementById('MA_DMSK');
        document.getElementById('lbl-review-category').textContent = catSelect.options[catSelect.selectedIndex]?.text || "-";

        const locSelect = document.getElementById('MA_DD');
        document.getElementById('lbl-review-location').textContent = locSelect.options[locSelect.selectedIndex]?.text || "-";

        const statusSelect = document.getElementById('TRANG_THAI');
        document.getElementById('lbl-review-status').textContent = statusSelect.options[statusSelect.selectedIndex]?.text || "-";

        document.getElementById('lbl-review-start').textContent = document.getElementById('TG_BAT_DAU').value.replace('T', ' ');
        document.getElementById('lbl-review-end').textContent = document.getElementById('TG_KET_THUC').value.replace('T', ' ') || "Không giới hạn";

        // Xử lý xem trước Poster nhỏ
        const posterUrl = document.getElementById('IMAGE_URL').value.trim();
        const imgEl = document.getElementById('review-poster');
        const placeholderEl = document.getElementById('review-poster-placeholder');
        if (posterUrl) {
            imgEl.src = posterUrl;
            imgEl.style.display = 'block';
            placeholderEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            placeholderEl.style.display = 'block';
        }

        // 2. ĐỔ DỮ LIỆU VÀO BẢNG HẠNG VÉ (BÊN TRÁI CARD 2)
        const tbody = document.getElementById('review-ticket-tbody');
        tbody.replaceChildren();
        builder_dsHangGhe.forEach(hg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px;"><div style="width: 20px; height: 20px; border-radius: 4px; background-color: ${hg.COLOR}; border: 1px solid #ccc;"></div></td>
                <td style="padding: 10px; font-weight: bold; color: #262532;">${hg.TEN_HG}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #28a745;">${hg.GIA_TIEN.toLocaleString()} đ</td>
            `;
            tbody.appendChild(tr);
        });

        // 3. THUẬT TOÁN COMPUTE/AGGREGATION: ĐẾM SỐ GHẾ THỰC TẾ ĐÃ VẼ (BÊN PHẢI CARD 2)
        const zonesContainer = document.getElementById('review-zones-container');
        zonesContainer.replaceChildren();

        // Kiểm tra xem sự kiện là FIXED_SEAT (có ghế) hay ZONE_BASED
        if (builder_layoutSeats.length > 0) {
            // FIXED SEAT luồng: Gom nhóm các ghế có chung cặp (TEN_KV + MA_HG)
            const zoneGroups = {};
            builder_layoutSeats.forEach(seat => {
                if (seat.MA_HG && seat.TEN_KV) {
                    const key = `${seat.TEN_KV}_${seat.MA_HG}`;
                    if (!zoneGroups[key]) {
                        zoneGroups[key] = {
                            TEN_KV: seat.TEN_KV,
                            MA_HG: seat.MA_HG,
                            count: 0
                        };
                    }
                    zoneGroups[key].count++;
                }
            });

            const groupsArray = Object.values(zoneGroups);
            if (groupsArray.length === 0) {
                zonesContainer.innerHTML = `<p style="color: #999; font-style: italic;">Chưa phân chia khu vực ghế.</p>`;
            } else {
                groupsArray.forEach(group => {
                    const hgInfo = builder_dsHangGhe.find(h => h.id == group.MA_HG);
                    const div = document.createElement('div');
                    div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8f9fa; border-radius: 6px; border-left: 5px solid " + (hgInfo?.COLOR || '#ccc') + ";";
                    div.innerHTML = `
                        <div>
                            <strong style="color: #262532;">📍 Khu: ${group.TEN_KV}</strong>
                            <small style="display: block; color: #666; margin-top: 2px;">Hạng vé: ${hgInfo?.TEN_HG || 'Mặc định'}</small>
                        </div>
                        <span style="background: #262532; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 13px;">${group.count} ghế đã tô</span>
                    `;
                    zonesContainer.appendChild(div);
                });
            }
        } else {
            // ZONE BASED luồng: Đổ dữ liệu từ danh sách Khu vực đứng tự do (nếu bạn gán vào builder_dsKhuVuc)
            zonesContainer.innerHTML = `<div style="padding: 15px; text-align: center; background: #fffde7; border: 1px dashed #f39c12; border-radius: 6px; color: #b7791f; font-style: italic;">Sơ đồ Khu tự do (Concert): Vé sẽ được phát hành dạng đứng không định vị ghế ngồi.</div>`;
        }

        renderReviewSeatMapCanvas();
        // 4. KÍCH HOẠT SỰ KIỆN ĐIỀU HƯỚNG NÚT BẤM CỦA TRANG REVIEW
        setupReviewScreenEvents();
    }

    function renderReviewSeatMapCanvas() {
        const sourceCanvas = document.getElementById('seatMapCanvas');
        const reviewCanvas = document.getElementById('reviewSeatMapCanvas');
        if (!reviewCanvas || !sourceCanvas) return;

        // Đồng bộ kích thước chuẩn của Canvas Bước 3 khớp hoàn toàn với Bước 2
        reviewCanvas.width = sourceCanvas.width;
        reviewCanvas.height = sourceCanvas.height;

        const ctx = reviewCanvas.getContext('2d');
        ctx.clearRect(0, 0, reviewCanvas.width, reviewCanvas.height);

        // Trường hợp 1: Nếu là địa điểm FIXED_SEAT (có dữ liệu ghế)
        if (builder_layoutSeats.length > 0) {
            builder_layoutSeats.forEach(seat => {
                ctx.beginPath();
                ctx.arc(seat.x, seat.y, 14, 0, Math.PI * 2);

                let fillColor = '#e0e0e0'; // Xám mặc định nếu ghế đó bị sót chưa tô màu
                let textColor = '#262532';

                // Tìm màu tương ứng với Hạng vé đã tô bằng cọ vẽ
                if (seat.MA_HG) {
                    const hg = builder_dsHangGhe.find(h => h.id == seat.MA_HG);
                    if (hg) {
                        fillColor = hg.COLOR;
                        textColor = 'white'; // Chuyển chữ sang màu trắng cho dễ nhìn trên nền màu
                    }
                }

                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#262532';
                ctx.stroke();

                // Điền tên vị trí ghế (VD: A1, A2)
                ctx.fillStyle = textColor;
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(seat.label, seat.x, seat.y);
            });
        } else {
            // Trường hợp 2: Địa điểm ZONE_BASED (Concert tự do, không chia tọa độ ghế tĩnh)
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, reviewCanvas.width, reviewCanvas.height);
            ctx.fillStyle = '#888';
            ctx.font = 'italic 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Sơ đồ phân khu đứng tự do (Zone-based). Không định vị tọa độ vị trí ghế ngồi.', reviewCanvas.width / 2, reviewCanvas.height / 2);
        }
    }

    function setupReviewScreenEvents() {
        const reviewScreen = document.getElementById('event-review-fullscreen');
        const btnBack = document.getElementById('btn-review-back');
        const btnFinalize = document.getElementById('btn-review-finalize');

        // Nút quay lại bước 2 (Sửa lại vé)
        btnBack.onclick = () => {
            reviewScreen.style.display = 'none';
            document.getElementById('ticket-builder-fullscreen').style.display = 'flex';
        };

        // Nút lưu cuối cùng (Gửi toàn bộ cục dữ liệu lên DB)
        btnFinalize.onclick = async () => {
            // Cấu trúc payload gửi lên backend bao gồm cả thông tin sự kiện, hạng vé và danh sách ghế
            const finalPayload = {
                TEN_SK: document.getElementById('TEN_SK').value.trim(),
                MA_DMSK: parseInt(document.getElementById('MA_DMSK').value),
                MA_DD: parseInt(document.getElementById('MA_DD').value),
                TG_BAT_DAU: document.getElementById('TG_BAT_DAU').value,
                TG_KET_THUC: document.getElementById('TG_KET_THUC').value,
                IMAGE_URL: document.getElementById('IMAGE_URL').value.trim(),
                TRANG_THAI: parseInt(document.getElementById('TRANG_THAI').value),
                MO_TA: document.getElementById('MO_TA').value.trim(),
                hang_ve: builder_dsHangGhe,
                ma_tran_ghe: builder_layoutSeats.filter(s => s.MA_HG !== null) // Chỉ gửi những ghế thực tế đã tô màu phân khu
            };

            console.log("Dữ liệu đóng gói gửi Backend:", finalPayload);

            // Giả lập Thanh toán / Đồng bộ CSDL thành công
            alert(`🎉 Chúc mừng! Sự kiện "${finalPayload.TEN_SK}" cùng hệ thống ${finalPayload.ma_tran_ghe.length} ghế phân hạng đã được kích hoạt thành công trên NovaEntry!`);

            // Tắt màn hình Review và khôi phục giao diện bảng chính
            reviewScreen.style.display = 'none';
            document.body.style.overflow = 'auto';

            // Tải lại danh sách bảng quản trị từ API
            loadEventDataFromAPI();
        };
    }

    function paintSeat(e) {
        const brushHgId = document.getElementById('CHON_HG_BRUSH').value;
        const currentZone = document.getElementById('TEN_KV').value.trim();

        if (!brushHgId) return; // Nếu chưa chọn cọ thì ko tô

        const canvas = document.getElementById('seatMapCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Tìm ghế dưới con trỏ chuột (Bán kính hít 15px)
        const seatIndex = builder_layoutSeats.findIndex(s => {
            return Math.sqrt(Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2)) <= 15;
        });

        if (seatIndex !== -1) {
            // Cập nhật Hạng vé và Khu vực cho ghế này
            builder_layoutSeats[seatIndex].MA_HG = brushHgId;
            builder_layoutSeats[seatIndex].TEN_KV = currentZone || "Chưa đặt tên khu";
            renderSeatMapCanvas(); // Vẽ lại liền
        }
    }

    async function openTicketBuilder(maSK, tenSK, maDD) {
        document.getElementById('builder-event-name').textContent = tenSK;
        document.getElementById('ticket-builder-fullscreen').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Reset dữ liệu
        builder_dsHangGhe = [];
        builder_layoutSeats = [];
        document.getElementById('TEN_KV').value = '';
        renderHangGheList();

        const canvas = document.getElementById('seatMapCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Tìm địa điểm trong cache để lấy sơ đồ Master
        const loc = allLocationsCache.find(l => l.MA_DD === maDD);
        if (loc && loc.LAYOUT_DATA) {
            // FIXED SEAT: Có ma trận ghế
            document.getElementById('zone-based-tools').style.display = 'none';
            try {
                const masterLayout = JSON.parse(loc.LAYOUT_DATA);
                // Copy ghế sang biến builder và bổ sung trường MA_HG, TEN_KV
                builder_layoutSeats = masterLayout.map(seat => ({
                    ...seat,
                    MA_HG: null,
                    TEN_KV: null
                }));
                renderSeatMapCanvas();
            } catch (e) {
                console.error(e);
            }
        } else {
            // ZONE BASED: Không có ghế, chỉ bật công cụ nhập sức chứa
            document.getElementById('zone-based-tools').style.display = 'block';
            ctx.fillStyle = '#666';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Địa điểm này là Khu vực tự do (Zone-based).', canvas.width / 2, canvas.height / 2);
            ctx.fillText('Vui lòng dùng công cụ cột trái để tạo các khu vực đứng.', canvas.width / 2, canvas.height / 2 + 30);
        }
    }

    function closeTicketBuilder() {
        document.getElementById('ticket-builder-modal').style.display = 'none';
    }

    function renderHangGheList() {
        const ul = document.getElementById('list-hang-ghe');
        const selectBrush = document.getElementById('CHON_HG_BRUSH');

        ul.replaceChildren();
        selectBrush.replaceChildren();
        selectBrush.innerHTML = '<option value="">-- Trỏ chuột để tẩy màu --</option>';

        builder_dsHangGhe.forEach(hg => {
            // Render <li>
            const li = document.createElement('li');
            li.style.cssText = `padding: 10px; border-left: 5px solid ${hg.COLOR}; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa;`;
            li.innerHTML = `
                <strong style="color: #262532;">${hg.TEN_HG}</strong>
                <span style="color: #28a745; font-weight: bold;">${hg.GIA_TIEN.toLocaleString()} đ</span>
            `;
            ul.appendChild(li);

            // Render Option Cọ vẽ
            const opt = document.createElement('option');
            opt.value = hg.id;
            opt.textContent = `🖌️ Tô: ${hg.TEN_HG}`;
            selectBrush.appendChild(opt);
        });
    }

    function renderSeatPreview() {
        const container = document.getElementById('seat-preview-container');
        if (builder_dsKhuVuc.length === 0) return;

        container.replaceChildren();

        builder_dsKhuVuc.forEach(kv => {
            const kvDiv = document.createElement('div');
            kvDiv.style.cssText = "margin-bottom: 25px; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.02);";

            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;";

            const titleWrapper = document.createElement('div');

            const h4 = document.createElement('h4');
            h4.style.cssText = "color: #262532; margin: 0; display: inline-block;";
            h4.textContent = `📍 ${kv.TEN_KV} `;

            const small = document.createElement('small');
            small.style.cssText = "color: #666; font-weight: normal; margin-left: 5px;";
            small.textContent = `(Tổng: ${kv.SUC_CHUA} vé)`;

            // Nhãn phân loại
            const typeLabel = document.createElement('span');
            typeLabel.style.cssText = "margin-left: 10px; background: #6c757d; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;";
            typeLabel.textContent = kv.LOAI_KV === 'STANDING' ? 'Vé Đứng' : 'Vé Ngồi';

            h4.append(small, typeLabel);
            titleWrapper.appendChild(h4);

            const spanHg = document.createElement('span');
            spanHg.style.cssText = "background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;";
            spanHg.textContent = kv.HANG_GHE.TEN_HG;

            headerDiv.append(titleWrapper, spanHg);

            const flexDiv = document.createElement('div');
            flexDiv.style.cssText = "display: flex; flex-wrap: wrap;";

            // Phân biệt cách render danh sách ghế
            if (kv.LOAI_KV === 'STANDING') {
                const standingMsg = document.createElement('div');
                standingMsg.style.cssText = "width: 100%; padding: 15px; text-align: center; background: #f8f9fa; border: 1px dashed #ced4da; border-radius: 6px; color: #495057; font-style: italic;";
                standingMsg.textContent = `Hệ thống đã tự động lưu trữ ${kv.SUC_CHUA} vé ảo cho khu vực tự do này.`;
                flexDiv.appendChild(standingMsg);
            } else {
                kv.GHE_LIST.forEach(g => {
                    const seatSpan = document.createElement('span');
                    seatSpan.style.cssText = "display:inline-block; width:35px; height:35px; line-height:35px; text-align:center; background:#6a95b8; color:white; border-radius:6px; margin:3px; font-size:12px; font-weight:bold;";
                    seatSpan.textContent = g.TEN_GHE;
                    flexDiv.appendChild(seatSpan);
                });
            }

            kvDiv.append(headerDiv, flexDiv);
            container.appendChild(kvDiv);
        });
    }

    function renderCanvasPreview() {
        const canvas = document.getElementById('seatMapCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let currentYOffset = 60; // Dùng để dời tọa độ Y xuống sau mỗi khu vực

        if (builder_dsKhuVuc.length === 0) {
            ctx.fillStyle = '#aaa';
            ctx.font = 'italic 16px Arial';
            ctx.fillText('Sơ đồ trống. Vui lòng tạo khu vực và sinh ghế.', 50, 50);
            return;
        }

        builder_dsKhuVuc.forEach(kv => {
            // 1. In tiêu đề khu vực
            ctx.fillStyle = '#262532';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            const title = `📍 ${kv.TEN_KV} (${kv.LOAI_KV === 'STANDING' ? 'Khu đứng' : 'Ghế ngồi'}) - Giá: ${kv.HANG_GHE.TEN_HG}`;
            ctx.fillText(title, 20, currentYOffset - 25);

            // 2. Vẽ chi tiết tùy theo loại
            if (kv.LOAI_KV === 'SEATING') {
                kv.GHE_LIST.forEach((ghe, index) => {
                    const x = 40 + (index % 20) * 40; // 20 ghế 1 hàng, cách nhau 40px
                    const y = currentYOffset + Math.floor(index / 20) * 40;

                    // Vẽ hình tròn (Ghế)
                    ctx.beginPath();
                    ctx.arc(x, y, 14, 0, Math.PI * 2);
                    ctx.fillStyle = '#6a95b8';
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#262532';
                    ctx.stroke();

                    // Tên ghế
                    ctx.fillStyle = 'white';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(ghe.TEN_GHE, x, y);
                });

                // Tính toán khoảng cách dời xuống cho khu vực tiếp theo
                const totalRows = Math.ceil(kv.GHE_LIST.length / 20);
                currentYOffset += totalRows * 40 + 60;

            } else if (kv.LOAI_KV === 'STANDING') {
                // Vẽ hộp đại diện cho Fanzone
                ctx.fillStyle = 'rgba(243, 156, 18, 0.15)';
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]); // Viền đứt nét
                ctx.strokeRect(20, currentYOffset - 10, 300, 80);
                ctx.fillRect(20, currentYOffset - 10, 300, 80);
                ctx.setLineDash([]); // Reset viền

                ctx.fillStyle = '#d35400';
                ctx.font = 'italic 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Tổng sức chứa: ${kv.SUC_CHUA} vé tự do`, 170, currentYOffset + 35);

                currentYOffset += 80 + 60;
            }
        });
    }

    function renderSeatMapCanvas() {
        const canvas = document.getElementById('seatMapCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        builder_layoutSeats.forEach(seat => {
            ctx.beginPath();
            ctx.arc(seat.x, seat.y, 14, 0, Math.PI * 2);

            let fillColor = '#e0e0e0'; // Xám mặc định (chưa phân hạng)
            let textColor = '#262532';

            // Nếu ghế đã được gán Hạng vé -> Lấy màu của hạng đó
            if (seat.MA_HG) {
                const hg = builder_dsHangGhe.find(h => h.id == seat.MA_HG);
                if (hg) {
                    fillColor = hg.COLOR;
                    textColor = 'white';
                }
            }

            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#262532';
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seat.label, seat.x, seat.y);
        });
    }

    function setupSearch() {
        const filterCategory = document.getElementById('filter-category');
        const filterStatus = document.getElementById('filter-status');

        // Hàm lọc tổng hợp
        function applyAllFilters() {
            const categoryValue = filterCategory ? filterCategory.value : '';
            const statusValue = filterStatus ? filterStatus.value : '';

            currentEventData = allEventData.filter(sk => {
                // Tiêu chí 1: Lọc theo từ khóa tìm kiếm (Thanh search)
                let matchKeyword = true;
                if (currentSearchKeyword) {
                    matchKeyword = (sk.TEN_SK && sk.TEN_SK.toLowerCase().includes(currentSearchKeyword)) ||
                        (sk.MA_SK && sk.MA_SK.toString().includes(currentSearchKeyword)) ||
                        (sk.TEN_DD && sk.TEN_DD.toLowerCase().includes(currentSearchKeyword)) ||
                        (sk.TEN_DM && sk.TEN_DM.toLowerCase().includes(currentSearchKeyword));
                }

                // Tiêu chí 2: Lọc theo Danh mục
                let matchCategory = true;
                if (categoryValue) {
                    matchCategory = (sk.TEN_DM === categoryValue);
                }

                // Tiêu chí 3: Lọc theo Trạng thái (1: Đang bán, 0: Đã khóa)
                let matchStatus = true;
                if (statusValue !== '') {
                    matchStatus = (sk.TRANG_THAI.toString() === statusValue);
                }

                return matchKeyword && matchCategory && matchStatus;
            });

            currentEventPage = 1; // Đưa về trang đầu tiên
            renderEventTable();   // Vẽ lại bảng
        }

        // Lắng nghe sự kiện gõ phím từ Web Component search-box
        document.addEventListener('search-changed', (e) => {
            currentSearchKeyword = e.detail.value.toLowerCase().trim();
            applyAllFilters();
        });

        // Lắng nghe sự kiện thay đổi trên 2 thẻ <select>
        if (filterCategory) filterCategory.addEventListener('change', applyAllFilters);
        if (filterStatus) filterStatus.addEventListener('change', applyAllFilters);

        document.addEventListener('trigger-category-filter', (e) => {
            if (filterCategory) {
                filterCategory.value = e.detail; // Tự động chọn select bằng tên danh mục
                applyAllFilters();               // Tự động gọi hàm lọc lại bảng sự kiện
            }
        });

        document.addEventListener('page-changed', (e) => {
            if (e.target.id === 'event-pagination') {
                currentEventPage = e.detail.page; // Sửa thành currentEventPage
                renderEventTable();               // Sửa thành gọi hàm render bảng Sự kiện
            }
        });
    }

    function openEditModal(eventObj) {
        const modal = document.getElementById('edit-event-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // 1. Đổ dữ liệu vào Form Tab 1
        document.getElementById('edit-event-name').textContent = eventObj.TEN_SK;
        document.getElementById('EDIT_MA_SK').value = eventObj.MA_SK;
        document.getElementById('EDIT_TEN_SK').value = eventObj.TEN_SK;
        document.getElementById('EDIT_TRANG_THAI').value = eventObj.TRANG_THAI;
        document.getElementById('EDIT_MO_TA').value = eventObj.MO_TA || '';

        // Xử lý hiển thị và preview ảnh Poster
        const imgInput = document.getElementById('EDIT_IMAGE_URL');
        const imgPreview = document.getElementById('edit-poster-preview');
        imgInput.value = eventObj.IMAGE_URL || '';
        imgPreview.src = eventObj.IMAGE_URL || 'https://placehold.co/400x200?text=No+Image';

        // Tự động load ảnh preview khi gõ URL
        imgInput.oninput = () => {
            imgPreview.src = imgInput.value || 'https://placehold.co/400x200?text=No+Image';
        };

        // Cắt bớt phần giây (nếu có) để nhét vừa vào datetime-local
        if (eventObj.TG_BAT_DAU) {
            document.getElementById('EDIT_TG_BAT_DAU').value = eventObj.TG_BAT_DAU.slice(0, 16);
        }

        // Clone Option Danh mục và Địa điểm vào Select của Edit
        document.getElementById('EDIT_MA_DMSK').innerHTML = document.getElementById('MA_DMSK').innerHTML;
        document.getElementById('EDIT_MA_DD').innerHTML = document.getElementById('MA_DD').innerHTML;

        // Tự động chọn đúng Danh mục
        if (eventObj.MA_DMSK) {
            document.getElementById('EDIT_MA_DMSK').value = eventObj.MA_DMSK;
        }

        // Tự động tìm và khóa đúng Địa điểm của sự kiện này
        let targetLoc = null;
        if (eventObj.MA_DD) {
            document.getElementById('EDIT_MA_DD').value = eventObj.MA_DD;
            targetLoc = allLocationsCache.find(l => l.MA_DD == eventObj.MA_DD);
        } else {
            // Dự phòng nếu API không trả về MA_DD mà chỉ trả về TEN_DD
            targetLoc = allLocationsCache.find(l => l.TEN_DD === eventObj.TEN_DD);
            if (targetLoc) document.getElementById('EDIT_MA_DD').value = targetLoc.MA_DD;
        }
        document.getElementById('EDIT_MA_DD').disabled = true;

        // 2. Chuyển Tab về mặc định (Tab 1)
        switchEditTab('edit-tab-1');

        // 3. ĐỔ DỮ LIỆU SƠ ĐỒ & VÉ THẬT VÀO TAB 2
        // Lấy danh sách hạng vé thật (Nếu API trả về mảng hang_ve, ta clone nó ra. Nếu chưa có thì rỗng)
        edit_dsHangGhe = eventObj.hang_ve ? JSON.parse(JSON.stringify(eventObj.hang_ve)) : [];
        renderEditHangGheList();

        const canvas = document.getElementById('editSeatMapCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Lấy Ma trận gốc của Địa điểm này
        if (targetLoc && targetLoc.LAYOUT_DATA) {
            try {
                const masterLayout = JSON.parse(targetLoc.LAYOUT_DATA);
                const configuredSeats = eventObj.ma_tran_ghe || []; // Mảng ghế đã tô màu thật từ DB

                // Khớp ma trận gốc của địa điểm với dữ liệu ghế đã cấu hình của sự kiện
                edit_layoutSeats = masterLayout.map(masterSeat => {
                    const cfgSeat = configuredSeats.find(s => s.label === masterSeat.label);
                    return {
                        ...masterSeat,
                        MA_HG: cfgSeat ? cfgSeat.MA_HG : null, // Lấy màu hạng vé đã tô (nếu có)
                        isSold: cfgSeat ? cfgSeat.isSold : false // Lấy trạng thái đã bán (nếu có)
                    };
                });
                renderEditSeatMapCanvas();
            } catch (e) {
                console.error("Lỗi khi Parse sơ đồ địa điểm:", e);
            }
        } else {
            edit_layoutSeats = [];
            ctx.fillStyle = '#666';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(targetLoc ? 'Khu vực này dùng sơ đồ Zone-based.' : 'Không tìm thấy dữ liệu địa điểm.', canvas.width / 2, canvas.height / 2);
        }
    }

    function switchEditTab(tabId) {
        document.querySelectorAll('.edit-tab-content').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.edit-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = '#888';
        });

        document.getElementById(tabId).style.display = 'flex';
        const activeBtn = document.querySelector(`.edit-tab-btn[data-target="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.borderBottomColor = '#7CCDFF';
            activeBtn.style.color = '#262532';
        }
    }

    function setupEditModalEvents() {
        const modal = document.getElementById('edit-event-modal');

        // Nút Đóng & Hủy
        const closeModals = () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        document.getElementById('close-edit-modal')?.addEventListener('click', closeModals);
        document.getElementById('btn-cancel-edit')?.addEventListener('click', closeModals);

        // Nút Tab
        document.querySelectorAll('.edit-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => switchEditTab(e.target.dataset.target));
        });

        // Nút Lưu cập nhật
        document.getElementById('btn-save-edit')?.addEventListener('click', () => {
            alert("✅ Đã cập nhật thông tin và sơ đồ sự kiện thành công!");
            closeModals();
            loadEventDataFromAPI();
        });

        // Nút Thêm Hạng Vé (Tab 2)
        document.getElementById('btn-edit-add-hg')?.addEventListener('click', () => {
            const ten = document.getElementById('EDIT_TEN_HG').value.trim();
            const gia = document.getElementById('EDIT_GIA_TIEN').value;
            const mau = document.getElementById('EDIT_MAU_HG').value;
            if (!ten || !gia) return alert("Vui lòng nhập tên hạng và giá tiền!");
            edit_dsHangGhe.push({id: Date.now(), TEN_HG: ten, GIA_TIEN: parseInt(gia), COLOR: mau});
            renderEditHangGheList();
        });

        // Cọ vẽ Canvas (Tab 2)
        const canvas = document.getElementById('editSeatMapCanvas');
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => {
                isEditPainting = true;
                paintEditSeat(e);
            });
            canvas.addEventListener('mousemove', (e) => {
                if (isEditPainting) paintEditSeat(e);
            });
            window.addEventListener('mouseup', () => {
                isEditPainting = false;
            });
        }
    }

    function paintEditSeat(e) {
        const brushHgId = document.getElementById('EDIT_CHON_HG_BRUSH').value;
        if (!brushHgId) return;

        const canvas = document.getElementById('editSeatMapCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const seatIndex = edit_layoutSeats.findIndex(s => Math.sqrt(Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2)) <= 15);

        if (seatIndex !== -1) {
            // NẾU GHẾ ĐÃ BÁN -> KHÔNG THỂ TÔ MÀU LẠI
            if (edit_layoutSeats[seatIndex].isSold) {
                // Không làm gì cả
            } else {
                edit_layoutSeats[seatIndex].MA_HG = brushHgId;
                renderEditSeatMapCanvas();
            }
        }
    }

    function renderEditSeatMapCanvas() {
        const canvas = document.getElementById('editSeatMapCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        edit_layoutSeats.forEach(seat => {
            ctx.beginPath();
            ctx.arc(seat.x, seat.y, 14, 0, Math.PI * 2);

            let fillColor = '#e0e0e0';
            let textColor = '#262532';

            if (seat.isSold) {
                // Ghế đã bán -> Màu đỏ đậm, bị khóa
                fillColor = '#e74c3c';
                textColor = 'white';
            } else if (seat.MA_HG) {
                const hg = edit_dsHangGhe.find(h => h.id == seat.MA_HG);
                if (hg) {
                    fillColor = hg.COLOR;
                    textColor = 'white';
                }
            }

            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#262532';
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seat.label, seat.x, seat.y);
        });
    }

    function renderEditHangGheList() {
        const ul = document.getElementById('edit-list-hang-ghe');
        const selectBrush = document.getElementById('EDIT_CHON_HG_BRUSH');

        ul.replaceChildren();
        selectBrush.replaceChildren();
        selectBrush.innerHTML = '<option value="">-- Trỏ chuột để tẩy màu --</option>';

        edit_dsHangGhe.forEach(hg => {
            ul.innerHTML += `<li style="padding: 10px; border-left: 4px solid ${hg.COLOR}; background: white; margin-bottom: 5px; border-radius: 4px; display: flex; justify-content: space-between;">
                <b>${hg.TEN_HG}</b> <span style="color: #28a745;">${hg.GIA_TIEN.toLocaleString()} đ</span>
            </li>`;

            selectBrush.innerHTML += `<option value="${hg.id}">🖌️ Tô: ${hg.TEN_HG}</option>`;
        });
    }

    // Kích hoạt
    init();
})();