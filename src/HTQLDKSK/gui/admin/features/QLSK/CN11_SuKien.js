(() => {
    // === TẠO VÙNG NHỚ ĐỘC LẬP CHO TAB SỰ KIỆN ===
    let currentEventData = [];
    let currentEventPage = 1;
    const rowsPerEventPage = 10;

    let builder_dsHangGhe = [];
    let builder_dsKhuVuc = [];

    // Khởi chạy
    function init() {
        loadEventDataFromAPI();
        loadLocationsForDropdown();
        setupAddEventModal();
        setupTicketBuilderEvents();
    }

    async function loadLocationsForDropdown() {
        const selectDD = document.getElementById('MA_DD');
        if (!selectDD) return;

        try {
            const response = await fetch('http://localhost:8000/api/dia-diem');
            if (response.ok) {
                const locations = await response.json();

                // Xóa các option cũ, giữ lại option mặc định
                selectDD.innerHTML = '<option value="">-- Chọn địa điểm --</option>';

                locations.forEach(loc => {
                    const option = document.createElement('option');
                    option.value = loc.MA_DD;
                    option.textContent = `${loc.TEN_DD} (${loc.DIA_CHI})`;
                    selectDD.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách địa điểm cho dropdown:", error);
        }
    }

    async function loadEventDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/su-kien');
            if (!response.ok) throw new Error("Lỗi tải API sự kiện");
            currentEventData = await response.json();
        } catch (error) {
            console.error("Dùng dữ liệu giả định do lỗi API:", error);
            currentEventData = [
                {
                    MA_SK: 1,
                    TEN_SK: 'Sky Tour 2026',
                    TEN_DM: 'Âm nhạc',
                    TG_BAT_DAU: '2026-08-15T19:00:00',
                    TEN_DD: 'Sân vận động Mỹ Đình',
                    VE_DA_BAN: 1250,
                    TRANG_THAI: 1
                },
                {
                    MA_SK: 3,
                    TEN_SK: 'Kịch Tấm Cám',
                    TEN_DM: 'Kịch nói',
                    TG_BAT_DAU: '2026-06-20T20:00:00',
                    TEN_DD: 'Nhà hát Hòa Bình',
                    VE_DA_BAN: 450,
                    TRANG_THAI: 1
                }
            ];
        }
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
            small.textContent = `SK${sk.MA_SK.toString().padStart(3, '0')} - ${sk.TEN_DM}`;
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

            const iconTicket = document.createElement('img');
            iconTicket.src = '../img/ticket.png';
            iconTicket.alt = 'Vé';
            iconTicket.classList.add('action-icon');
            iconTicket.title = 'Thiết lập Vé & Ghế';
            iconTicket.addEventListener('click', () => openTicketBuilder(sk.MA_SK, sk.TEN_SK));

            const iconEdit = document.createElement('img');
            iconEdit.src = '../img/EDIT.png';
            iconEdit.alt = 'Sửa';
            iconEdit.classList.add('action-icon');

            const iconLock = document.createElement('img');
            iconLock.src = '../img/LOCK.png';
            iconLock.alt = 'Khóa';
            iconLock.classList.add('action-icon');

            const iconDelete = document.createElement('img');
            iconDelete.src = '../img/DELETE.png';
            iconDelete.alt = 'Xóa';
            iconDelete.classList.add('action-icon');

            tdActions.append(iconTicket, iconEdit, iconLock, iconDelete);
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

        paginationContainer.replaceChildren();
        const totalPages = Math.max(1, Math.ceil(currentEventData.length / rowsPerEventPage));

        const prevSpan = document.createElement('span');
        prevSpan.textContent = '<';
        prevSpan.onclick = () => {
            if (currentEventPage > 1) {
                currentEventPage--;
                renderEventTable();
            }
        };
        paginationContainer.appendChild(prevSpan);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentEventPage) pageSpan.classList.add('active');
            pageSpan.onclick = () => {
                currentEventPage = i;
                renderEventTable();
            };
            paginationContainer.appendChild(pageSpan);
        }

        const nextSpan = document.createElement('span');
        nextSpan.textContent = '>';
        nextSpan.onclick = () => {
            if (currentEventPage < totalPages) {
                currentEventPage++;
                renderEventTable();
            }
        };
        paginationContainer.appendChild(nextSpan);
    }

    function setupAddEventModal() {
        const addBtn = document.querySelector('.add-btn');
        const modal = document.getElementById('add-event-modal');
        const closeBtn = document.getElementById('close-add-modal');
        const cancelBtn = document.getElementById('cancel-add-btn');

        if (!addBtn || !modal) return;

        const openModal = () => {
            modal.style.display = 'flex';
        };
        const closeModal = () => {
            modal.style.display = 'none';
            const form = document.getElementById('addEventForm');
            if (form) form.reset();
        };

        addBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    }

    function setupTicketBuilderEvents() {
        const closeBuilderBtn = document.getElementById('close-builder-btn');
        const cancelBuilderBtn = document.getElementById('cancel-builder-btn');
        const btnSaveBuilder = document.getElementById('save-builder-btn');
        if (btnSaveBuilder) {
            btnSaveBuilder.addEventListener('click', async () => {
                const payload = {
                    hang_ghe: builder_dsHangGhe,
                    khu_vuc: builder_dsKhuVuc
                };

                try {
                    // Sẽ cần viết thêm API method POST tương ứng ở backend để hứng cục payload này
                    const response = await fetch(`http://localhost:8000/api/events/${currentEditingEventId}/seats`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        alert("✅ Đã lưu Cấu hình Vé và Sơ đồ thành công!");
                        closeTicketBuilder();
                    } else {
                        alert("❌ Lưu thất bại!");
                    }
                } catch (e) {
                    console.error(e);
                }
            });
        }

        if (closeBuilderBtn) closeBuilderBtn.addEventListener('click', closeTicketBuilder);
        if (cancelBuilderBtn) cancelBuilderBtn.addEventListener('click', closeTicketBuilder);

        // Bổ sung: Tìm container của trường Tên khu vực để chèn Loại khu vực
        const tenKVInput = document.getElementById('TEN_KV');
        if (tenKVInput) {
            const formRowKV = tenKVInput.closest('.form-row');

            // Tạo UI bằng DOM API
            const formGroupLoaiKV = document.createElement('div');
            formGroupLoaiKV.className = 'form-group';
            formGroupLoaiKV.style.flex = '1.5';

            const labelLoaiKV = document.createElement('label');
            labelLoaiKV.textContent = 'Loại khu vực';

            const selectLoaiKV = document.createElement('select');
            selectLoaiKV.id = 'LOAI_KV';

            const optSeating = document.createElement('option');
            optSeating.value = 'SEATING';
            optSeating.textContent = 'Ghế ngồi';

            const optStanding = document.createElement('option');
            optStanding.value = 'STANDING';
            optStanding.textContent = 'Khu đứng (Tự do)';

            selectLoaiKV.append(optSeating, optStanding);
            formGroupLoaiKV.append(labelLoaiKV, selectLoaiKV);

            // Chèn Select vào trước ô Dãy ghế
            formRowKV.insertBefore(formGroupLoaiKV, document.getElementById('DAY_GHE').closest('.form-group'));

            // Sự kiện: Đổi LOAI_KV thì ẩn/hiện nhập Dãy và đổi nhãn Số ghế thành Sức chứa
            selectLoaiKV.addEventListener('change', (e) => {
                const isStanding = e.target.value === 'STANDING';
                const dayGheGroup = document.getElementById('DAY_GHE').closest('.form-group');
                const soGheGroup = document.getElementById('SO_GHE_DAY').closest('.form-group');

                if (isStanding) {
                    dayGheGroup.style.display = 'none';
                    soGheGroup.querySelector('label').textContent = 'Sức chứa tối đa';
                    document.getElementById('SO_GHE_DAY').placeholder = 'VD: 1000';
                } else {
                    dayGheGroup.style.display = 'block';
                    soGheGroup.querySelector('label').textContent = 'Số ghế / Dãy';
                    document.getElementById('SO_GHE_DAY').placeholder = 'VD: 50';
                }
            });
        }

        const btnAddHg = document.getElementById('btn-add-hg');
        if (btnAddHg) {
            btnAddHg.addEventListener('click', () => {
                const tenHGInput = document.getElementById('TEN_HG');
                const giaTienInput = document.getElementById('GIA_TIEN');
                const tenHG = tenHGInput.value.trim();
                const giaTien = giaTienInput.value;

                if (!tenHG || !giaTien) return alert("Vui lòng nhập tên hạng và giá tiền!");

                builder_dsHangGhe.push({id: Date.now(), TEN_HG: tenHG, GIA_TIEN: parseInt(giaTien)});
                tenHGInput.value = '';
                giaTienInput.value = '';
                renderHangGheList();
            });
        }

        const btnGenSeats = document.getElementById('btn-generate-seats');
        if (btnGenSeats) {
            btnGenSeats.addEventListener('click', () => {
                const tenKVInput = document.getElementById('TEN_KV');
                const hgId = document.getElementById('CHON_HG').value;
                const loaiKV = document.getElementById('LOAI_KV').value; // Lấy giá trị loại KV
                const dayGheInput = document.getElementById('DAY_GHE');
                const soGheDayInput = document.getElementById('SO_GHE_DAY');

                const tenKV = tenKVInput.value.trim();
                const dayGhe = dayGheInput.value.toUpperCase().trim();
                const soGheDay = parseInt(soGheDayInput.value); // Là sức chứa nếu STANDING

                // Kiểm tra validate linh hoạt
                if (!tenKV || !hgId || isNaN(soGheDay)) {
                    return alert("Vui lòng điền đủ thông tin khu vực!");
                }
                if (loaiKV === 'SEATING' && !dayGhe) {
                    return alert("Vui lòng nhập tên dãy ghế cho khu vực ngồi!");
                }

                const hgSelected = builder_dsHangGhe.find(h => h.id == hgId);
                let danhSachGheMoi = [];

                // Phân nhánh logic sinh ghế
                if (loaiKV === 'SEATING') {
                    for (let i = 1; i <= soGheDay; i++) {
                        danhSachGheMoi.push({DAY_GHE: dayGhe, SO_GHE: i, TEN_GHE: `${dayGhe}${i}`});
                    }
                } else {
                    // Tạo ghế ảo cho STANDING bằng cách gán cứng tiền tố
                    for (let i = 1; i <= soGheDay; i++) {
                        danhSachGheMoi.push({DAY_GHE: 'FZONE', SO_GHE: i, TEN_GHE: `FZONE-${i}`});
                    }
                }

                const existingKVIndex = builder_dsKhuVuc.findIndex(kv => kv.TEN_KV === tenKV);
                if (existingKVIndex >= 0) {
                    builder_dsKhuVuc[existingKVIndex].SUC_CHUA += soGheDay;
                    builder_dsKhuVuc[existingKVIndex].GHE_LIST.push(...danhSachGheMoi);
                } else {
                    builder_dsKhuVuc.push({
                        id: Date.now(),
                        TEN_KV: tenKV,
                        HANG_GHE: hgSelected,
                        LOAI_KV: loaiKV, // Lưu loại khu vực vào state
                        SUC_CHUA: soGheDay,
                        GHE_LIST: danhSachGheMoi
                    });
                }

                dayGheInput.value = '';
                soGheDayInput.value = '';
                renderCanvasPreview();
            });
        }
    }

    async function openTicketBuilder(maSK, tenSK) {
        document.getElementById('builder-event-name').textContent = `- ${tenSK}`;
        document.getElementById('ticket-builder-modal').style.display = 'flex';

        // 1. Hiển thị thông báo đang tải trên Canvas
        const canvas = document.getElementById('seatMapCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.fillText('⏳ Đang tải dữ liệu sơ đồ...', 50, 50);

        try {
            // 2. Gọi API thực tế để lấy sơ đồ của Sự kiện này
            const response = await fetch(`http://localhost:8000/api/events/${maSK}/seats`);
            if (!response.ok) throw new Error("Chưa có API thực tế");
            const data = await response.json();

            builder_dsHangGhe = data.hang_ghe;
            builder_dsKhuVuc = data.khu_vuc;
        } catch (error) {
            console.warn("Dùng dữ liệu giả định vì chưa có API backend:", error);

            // 3. GIẢ LẬP DỮ LIỆU TỪ DATABASE (VD: Cho sự kiện Sky Tour - Mã: 1)
            if (maSK === 1) {
                builder_dsHangGhe = [
                    {id: 1, TEN_HG: 'VIP', GIA_TIEN: 5000000},
                    {id: 2, TEN_HG: 'GA (Fanzone)', GIA_TIEN: 1500000}
                ];
                builder_dsKhuVuc = [
                    {
                        id: 1, TEN_KV: 'Khán đài A', LOAI_KV: 'SEATING', SUC_CHUA: 15, HANG_GHE: builder_dsHangGhe[0],
                        GHE_LIST: Array.from({length: 15}, (_, i) => ({
                            DAY_GHE: 'A',
                            SO_GHE: i + 1,
                            TEN_GHE: `A${i + 1}`
                        }))
                    },
                    {
                        id: 2,
                        TEN_KV: 'Fanzone Mặt sân',
                        LOAI_KV: 'STANDING',
                        SUC_CHUA: 1000,
                        HANG_GHE: builder_dsHangGhe[1],
                        GHE_LIST: []
                    }
                ];
            } else {
                // Nếu là sự kiện chưa có sơ đồ -> Trả về mảng rỗng để tạo mới
                builder_dsHangGhe = [];
                builder_dsKhuVuc = [];
            }
        }

        // 4. Render lại giao diện sau khi có dữ liệu
        renderHangGheList();
        renderCanvasPreview();
    }

    function closeTicketBuilder() {
        document.getElementById('ticket-builder-modal').style.display = 'none';
    }

    function renderHangGheList() {
        const ul = document.getElementById('list-hang-ghe');
        const select = document.getElementById('CHON_HG');

        ul.replaceChildren();
        select.replaceChildren();

        const optDefault = document.createElement('option');
        optDefault.value = "";
        optDefault.textContent = "-- Chọn hạng --";
        select.appendChild(optDefault);

        builder_dsHangGhe.forEach(hg => {
            const li = document.createElement('li');
            li.style.cssText = "padding: 12px; border: 1px solid #ddd; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; background: #fff;";

            const strong = document.createElement('strong');
            strong.style.color = '#262532';
            strong.textContent = hg.TEN_HG;

            const span = document.createElement('span');
            span.style.cssText = "color: #28a745; font-weight: bold;";
            span.textContent = `${hg.GIA_TIEN.toLocaleString()} đ`;

            li.append(strong, span);
            ul.appendChild(li);

            const opt = document.createElement('option');
            opt.value = hg.id;
            opt.textContent = `${hg.TEN_HG} (${hg.GIA_TIEN.toLocaleString()} đ)`;
            select.appendChild(opt);
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

    // Kích hoạt
    init();
})();