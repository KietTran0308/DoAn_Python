(() => {
    let eventsData = [];
    let mockTicketsDb = []; 
    let scanHistory = []; // Lưu các log check_in_log mới nhất trong ca trực

    let validCount = 0;
    let invalidCount = 0;

    function init() {
        loadMockData();
        setupEvents();
        document.getElementById('qr-input').focus(); // Luôn trỏ chuột vào ô nhập để súng quét sẵn sàng
    }

    function loadMockData() {
        // 1. Danh sách sự kiện
        eventsData = [
            { MA_SK: 1, TEN_SK: 'Sky Tour 2026' },
            { MA_SK: 2, TEN_SK: 'Show của Đen' },
            { MA_SK: 3, TEN_SK: 'Kịch Tấm Cám' }
        ];

        const eventSelect = document.getElementById('scan-event-select');
        eventsData.forEach(sk => {
            const option = document.createElement('option');
            option.value = sk.MA_SK;
            option.textContent = sk.TEN_SK;
            eventSelect.appendChild(option);
        });

        // 2. Database giả lập vé (Kết hợp bảng ve, don_hang, ghe, tai_khoan)
        mockTicketsDb = [
            { MA_VE: 1, QR_CODE: 'QR_TICKET_001', MA_SK: 1, TEN_HG: 'VIP', VI_TRI: 'Ghế A-1', KHACH_HANG: 'Trần Khách A', DA_QUET: false },
            { MA_VE: 2, QR_CODE: 'QR_TICKET_002', MA_SK: 1, TEN_HG: 'VIP', VI_TRI: 'Ghế A-2', KHACH_HANG: 'Phạm Khách B', DA_QUET: true }, // Đã quét trước đó
            { MA_VE: 3, QR_CODE: 'QR_TICKET_003', MA_SK: 1, TEN_HG: 'VVIP', VI_TRI: 'Ghế VVIP-1', KHACH_HANG: 'Vũ VIP C', DA_QUET: false },
            { MA_VE: 4, QR_CODE: 'QR_TICKET_004', MA_SK: 3, TEN_HG: 'Standard', VI_TRI: 'Ghế A-1', KHACH_HANG: 'Đặng Khách D', DA_QUET: false },
        ];
    }

    function setupEvents() {
        const scanForm = document.getElementById('scan-form');
        
        scanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const qrInput = document.getElementById('qr-input');
            const qrCode = qrInput.value.trim();
            const eventId = parseInt(document.getElementById('scan-event-select').value);
            const gateName = document.getElementById('scan-gate').value.trim() || 'Cổng Default';

            if (!eventId) {
                alert("Vui lòng chọn Sự kiện đang trực trước khi quét vé!");
                qrInput.value = '';
                return;
            }

            if (qrCode) {
                processScan(qrCode, eventId, gateName);
                qrInput.value = ''; // Xóa trắng để quét vé tiếp theo
                qrInput.focus();
            }
        });
    }

    function processScan(qrCode, currentEventId, gateName) {
        const badge = document.getElementById('scan-result-badge');
        const infoContainer = document.getElementById('ticket-info-container');
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Tìm vé trong Database
        const ticket = mockTicketsDb.find(t => t.QR_CODE === qrCode);

        let statusText = "";
        let isSuccess = false;
        let seatInfo = "---";

        if (!ticket) {
            // Lỗi 1: Vé không tồn tại
            statusText = "❌ VÉ KHÔNG TỒN TẠI (VÉ GIẢ)";
            badge.style.cssText = "background: #f8d7da; border: 2px solid #dc3545; color: #dc3545; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin-bottom: 20px;";
            infoContainer.style.display = 'none';
        } 
        else if (ticket.MA_SK !== currentEventId) {
            // Lỗi 2: Sai sự kiện
            statusText = "❌ VÉ KHÔNG THUỘC SỰ KIỆN NÀY";
            badge.style.cssText = "background: #fff3cd; border: 2px solid #ffc107; color: #856404; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin-bottom: 20px;";
            showTicketInfo(ticket);
        }
        else if (ticket.DA_QUET) {
            // Lỗi 3: Vé đã được sử dụng
            statusText = "⚠️ VÉ ĐÃ ĐƯỢC SỬ DỤNG TRƯỚC ĐÓ";
            badge.style.cssText = "background: #fff3cd; border: 2px solid #ffc107; color: #856404; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin-bottom: 20px;";
            showTicketInfo(ticket);
        }
        else {
            // THÀNH CÔNG
            isSuccess = true;
            ticket.DA_QUET = true; // Cập nhật trạng thái đã quét
            seatInfo = ticket.VI_TRI;
            
            statusText = "✅ VÉ HỢP LỆ - CHO PHÉP VÀO";
            badge.style.cssText = "background: #d4edda; border: 2px solid #28a745; color: #155724; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin-bottom: 20px;";
            showTicketInfo(ticket);
        }

        badge.textContent = statusText;

        // Cập nhật thống kê
        if (isSuccess) {
            validCount++;
            document.getElementById('count-valid').textContent = validCount;
        } else {
            invalidCount++;
            document.getElementById('count-invalid').textContent = invalidCount;
        }

        // Ghi Log lịch sử check-in
        logHistory(timeStr, qrCode, gateName, seatInfo, isSuccess);
    }

    function showTicketInfo(ticket) {
        document.getElementById('ticket-info-container').style.display = 'grid';
        document.getElementById('ti-qr').textContent = ticket.QR_CODE;
        document.getElementById('ti-class').textContent = ticket.TEN_HG;
        document.getElementById('ti-seat').textContent = ticket.VI_TRI;
        document.getElementById('ti-customer').textContent = ticket.KHACH_HANG;
    }

    function logHistory(time, qr, gate, seat, isSuccess) {
        // Đưa lên đầu mảng
        scanHistory.unshift({ time, qr, gate, seat, isSuccess });
        
        // Chỉ giữ 10 log gần nhất cho đỡ nặng DOM
        if (scanHistory.length > 10) scanHistory.pop();
        
        renderHistoryTable();
    }

    function renderHistoryTable() {
        const tbody = document.getElementById('scan-history-body');
        tbody.replaceChildren();

        scanHistory.forEach(log => {
            const tr = document.createElement('tr');
            
            const tdTime = document.createElement('td');
            tdTime.textContent = log.time;

            const tdQR = document.createElement('td');
            tdQR.style.fontWeight = "bold";
            tdQR.textContent = log.qr;

            const tdGate = document.createElement('td');
            tdGate.textContent = log.gate;

            const tdSeat = document.createElement('td');
            tdSeat.textContent = log.seat;

            const tdStatus = document.createElement('td');
            tdStatus.style.textAlign = 'center';
            const badge = document.createElement('span');
            badge.style.cssText = "padding: 4px 10px; border-radius: 12px; font-size: 12px; color: white; font-weight: bold;";
            
            if (log.isSuccess) {
                badge.style.background = '#28a745';
                badge.textContent = 'Thành công';
            } else {
                badge.style.background = '#dc3545';
                badge.textContent = 'Thất bại';
            }
            tdStatus.appendChild(badge);

            tr.append(tdTime, tdQR, tdGate, tdSeat, tdStatus);
            tbody.appendChild(tr);
        });
    }

    init();
})();