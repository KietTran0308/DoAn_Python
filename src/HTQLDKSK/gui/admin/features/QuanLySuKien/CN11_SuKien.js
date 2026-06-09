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
        setupAddEventModal();
        setupTicketBuilderEvents();
    }

    async function loadEventDataFromAPI() {
        try {
            const response = await fetch('http://localhost:8000/api/events');
            if (!response.ok) throw new Error("Lỗi tải API sự kiện");
            currentEventData = await response.json();
        } catch (error) {
            console.error("Dùng dữ liệu giả định do lỗi API:", error);
            currentEventData = [
                { MA_SK: 1, TEN_SK: 'Sky Tour 2026', TEN_DM: 'Âm nhạc', TG_BAT_DAU: '2026-08-15T19:00:00', TEN_DD: 'Sân vận động Mỹ Đình', VE_DA_BAN: 1250, TRANG_THAI: 1 },
                { MA_SK: 3, TEN_SK: 'Kịch Tấm Cám', TEN_DM: 'Kịch nói', TG_BAT_DAU: '2026-06-20T20:00:00', TEN_DD: 'Nhà hát Hòa Bình', VE_DA_BAN: 450, TRANG_THAI: 1 }
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
            const formattedDate = `${dateObj.getDate().toString().padStart(2,'0')} / ${(dateObj.getMonth()+1).toString().padStart(2,'0')} / ${dateObj.getFullYear()} - ${dateObj.getHours()}h${dateObj.getMinutes().toString().padStart(2,'0')}`;

            const tdName = document.createElement('td');
            const strong = document.createElement('strong');
            strong.textContent = sk.TEN_SK;
            const br = document.createElement('br');
            const small = document.createElement('small');
            small.textContent = `SK${sk.MA_SK.toString().padStart(3,'0')} - ${sk.TEN_DM}`;
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

    function setupAddEventModal() {
        const addBtn = document.querySelector('.add-btn');
        const modal = document.getElementById('add-event-modal');
        const closeBtn = document.getElementById('close-add-modal');
        const cancelBtn = document.getElementById('cancel-add-btn');

        if (!addBtn || !modal) return;

        const openModal = () => { modal.style.display = 'flex'; };
        const closeModal = () => {
            modal.style.display = 'none';
            const form = document.getElementById('addEventForm');
            if (form) form.reset();
        };

        addBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    function setupTicketBuilderEvents() {
        const closeBuilderBtn = document.getElementById('close-builder-btn');
        const cancelBuilderBtn = document.getElementById('cancel-builder-btn');
        if (closeBuilderBtn) closeBuilderBtn.addEventListener('click', closeTicketBuilder);
        if (cancelBuilderBtn) cancelBuilderBtn.addEventListener('click', closeTicketBuilder);

        const btnAddHg = document.getElementById('btn-add-hg');
        if (btnAddHg) {
            btnAddHg.addEventListener('click', () => {
                const tenHGInput = document.getElementById('TEN_HG');
                const giaTienInput = document.getElementById('GIA_TIEN');
                const tenHG = tenHGInput.value.trim();
                const giaTien = giaTienInput.value;

                if (!tenHG || !giaTien) return alert("Vui lòng nhập tên hạng và giá tiền!");

                builder_dsHangGhe.push({ id: Date.now(), TEN_HG: tenHG, GIA_TIEN: parseInt(giaTien) });
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
                const dayGheInput = document.getElementById('DAY_GHE');
                const soGheDayInput = document.getElementById('SO_GHE_DAY');

                const tenKV = tenKVInput.value.trim();
                const dayGhe = dayGheInput.value.toUpperCase().trim();
                const soGheDay = parseInt(soGheDayInput.value);

                if (!tenKV || !hgId || !dayGhe || !soGheDay) {
                    return alert("Vui lòng điền đủ thông tin khu vực và dãy ghế!");
                }

                const hgSelected = builder_dsHangGhe.find(h => h.id == hgId);
                let danhSachGheMoi = [];

                for (let i = 1; i <= soGheDay; i++) {
                    danhSachGheMoi.push({ DAY_GHE: dayGhe, SO_GHE: i, TEN_GHE: `${dayGhe}${i}` });
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
                        SUC_CHUA: soGheDay,
                        GHE_LIST: danhSachGheMoi
                    });
                }

                dayGheInput.value = '';
                soGheDayInput.value = '';
                renderSeatPreview();
            });
        }
    }

    function openTicketBuilder(maSK, tenSK) {
        document.getElementById('builder-event-name').textContent = `- ${tenSK}`;
        document.getElementById('ticket-builder-modal').style.display = 'flex';
        builder_dsHangGhe = [];
        builder_dsKhuVuc = [];
        renderHangGheList();
        renderSeatPreview();
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
            headerDiv.style.cssText = "display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;";

            const h4 = document.createElement('h4');
            h4.style.cssText = "color: #262532; margin: 0;";
            h4.textContent = `📍 ${kv.TEN_KV} `;

            const small = document.createElement('small');
            small.style.cssText = "color: #666; font-weight: normal;";
            small.textContent = `(Tổng: ${kv.SUC_CHUA} ghế)`;
            h4.appendChild(small);

            const spanHg = document.createElement('span');
            spanHg.style.cssText = "background: #28a745; color: white; padding: 3px 10px; border-radius: 20px; font-size: 13px;";
            spanHg.textContent = kv.HANG_GHE.TEN_HG;

            headerDiv.append(h4, spanHg);

            const flexDiv = document.createElement('div');
            flexDiv.style.cssText = "display: flex; flex-wrap: wrap;";

            kv.GHE_LIST.forEach(g => {
                const seatSpan = document.createElement('span');
                seatSpan.style.cssText = "display:inline-block; width:35px; height:35px; line-height:35px; text-align:center; background:#6a95b8; color:white; border-radius:6px; margin:3px; font-size:12px; font-weight:bold;";
                seatSpan.textContent = g.TEN_GHE;
                flexDiv.appendChild(seatSpan);
            });

            kvDiv.append(headerDiv, flexDiv);
            container.appendChild(kvDiv);
        });
    }

    // Kích hoạt
    init();
})();