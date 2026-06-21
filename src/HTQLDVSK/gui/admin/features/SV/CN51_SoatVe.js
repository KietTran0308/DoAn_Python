(() => {
    const API_BASE = 'http://localhost:8000';

    let scanHistory = [];
    let validCount = 0;
    let invalidCount = 0;

    // Lấy thông tin nhân viên đang đăng nhập từ sessionStorage
    const currentUser = JSON.parse(sessionStorage.getItem('user')) || {};
    const MA_TK_NHAN_VIEN = currentUser.ma_tk || null;

    // KHỞI TẠO
    async function init() {
        await loadSuKienList();
        setupEvents();
        document.getElementById('qr-input').focus();
    }

    // TẢI DANH SÁCH SỰ KIỆN TỪ API
    async function loadSuKienList() {
        try {
            const res = await fetch(`${API_BASE}/api/su-kien`);
            if (!res.ok) throw new Error('Lỗi tải danh sách sự kiện');
            const data = await res.json();

            const select = document.getElementById('scan-event-select');
            // Xóa các option cũ (trừ option đầu tiên)
            select.innerHTML = '<option value="">-- Chọn sự kiện --</option>';

            data.forEach(sk => {
                const option = document.createElement('option');
                option.value = sk.MA_SK;
                option.textContent = sk.TEN_SK;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Không tải được danh sách sự kiện:', err);
            if (window.Toast) window.Toast.warning('Không tải được danh sách sự kiện. Kiểm tra kết nối server.');
        }
    }

    // GẮN SỰ KIỆN
    function setupEvents() {
        const scanForm = document.getElementById('scan-form');

        scanForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const qrInput = document.getElementById('qr-input');
            const qrCode = qrInput.value.trim();
            const eventId = document.getElementById('scan-event-select').value;
            const gateName = document.getElementById('scan-gate').value.trim() || 'Cổng Chính';

            if (!eventId) {
                if (window.Toast) window.Toast.warning('Vui lòng chọn sự kiện đang trực trước khi quét vé!');
                qrInput.value = '';
                return;
            }

            if (!MA_TK_NHAN_VIEN) {
                if (window.Toast) window.Toast.warning('Không xác định được tài khoản nhân viên. Vui lòng đăng nhập lại.');
                return;
            }

            if (qrCode) {
                processScan(qrCode, gateName);
                qrInput.value = '';
                qrInput.focus();
            }
        });
    }

    // XỬ LÝ QUÉT VÉ — GỌI API THẬT
    async function processScan(qrCode, gateName) {
        const badge = document.getElementById('scan-result-badge');
        const infoContainer = document.getElementById('ticket-info-container');

        // Hiển thị trạng thái đang xử lý
        badge.textContent = '⏳ ĐANG KIỂM TRA...';
        badge.style.cssText = styleBase('background: #e9ecef; border: 2px solid #adb5bd; color: #495057;');
        infoContainer.style.display = 'none';

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN');

        try {
            const res = await fetch(`${API_BASE}/api/checkin/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_code: qrCode,
                    ma_tk: MA_TK_NHAN_VIEN,
                    ten_cong: gateName
                })
            });

            const result = await res.json();

            if (result.hop_le) {
                // ✅ VÉ HỢP LỆ
                validCount++;
                document.getElementById('count-valid').textContent = validCount;

                badge.textContent = '✅ VÉ HỢP LỆ — CHO PHÉP VÀO';
                badge.style.cssText = styleBase('background: #d4edda; border: 2px solid #28a745; color: #155724;');

                showTicketInfo({
                    QR_CODE: qrCode,
                    TEN_HG: result.ten_su_kien || '---',
                    VI_TRI: result.gia_ve ? formatCurrency(result.gia_ve) : '---',
                    KHACH_HANG: result.ten_khach || '---',
                    EMAIL: result.email || ''
                });

                logHistory(timeStr, qrCode, gateName, result.ten_khach || '---', true);
            } else {
                // ❌ VÉ KHÔNG HỢP LỆ
                invalidCount++;
                document.getElementById('count-invalid').textContent = invalidCount;

                const msg = result.tin_nhan || 'Vé không hợp lệ';

                // Phân biệt lỗi vé đã dùng vs vé giả
                if (msg.includes('đã được sử dụng')) {
                    badge.textContent = `⚠️ ${msg.toUpperCase()}`;
                    badge.style.cssText = styleBase('background: #fff3cd; border: 2px solid #ffc107; color: #856404;');
                } else {
                    badge.textContent = `❌ ${msg.toUpperCase()}`;
                    badge.style.cssText = styleBase('background: #f8d7da; border: 2px solid #dc3545; color: #dc3545;');
                }

                infoContainer.style.display = 'none';
                logHistory(timeStr, qrCode, gateName, '---', false);
            }

        } catch (err) {
            console.error('Lỗi kết nối API soát vé:', err);
            badge.textContent = '🔌 LỖI KẾT NỐI SERVER';
            badge.style.cssText = styleBase('background: #f8d7da; border: 2px solid #dc3545; color: #dc3545;');
            if (window.Toast) window.Toast.warning('Không thể kết nối tới server. Kiểm tra lại backend.');

            invalidCount++;
            document.getElementById('count-invalid').textContent = invalidCount;
            logHistory(timeStr, qrCode, gateName, '---', false);
        }
    }

    // HIỂN THỊ THÔNG TIN VÉ
    function showTicketInfo(ticket) {
        document.getElementById('ticket-info-container').style.display = 'grid';
        document.getElementById('ti-qr').textContent = ticket.QR_CODE;
        document.getElementById('ti-class').textContent = ticket.TEN_HG;
        document.getElementById('ti-seat').textContent = ticket.VI_TRI;
        document.getElementById('ti-customer').textContent = ticket.EMAIL
            ? `${ticket.KHACH_HANG} (${ticket.EMAIL})`
            : ticket.KHACH_HANG;
    }

    // GHI VÀ HIỂN THỊ LỊCH SỬ QUÉT (LOCAL — CA TRỰC HIỆN TẠI)
    function logHistory(time, qr, gate, khach, isSuccess) {
        scanHistory.unshift({ time, qr, gate, khach, isSuccess });
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
            tdQR.style.cssText = 'font-weight: bold; font-family: monospace;';
            tdQR.textContent = log.qr;

            const tdGate = document.createElement('td');
            tdGate.textContent = log.gate;

            const tdKhach = document.createElement('td');
            tdKhach.textContent = log.khach;

            const tdStatus = document.createElement('td');
            tdStatus.style.textAlign = 'center';
            const badge = document.createElement('span');
            badge.style.cssText = 'padding: 4px 10px; border-radius: 12px; font-size: 12px; color: white; font-weight: bold;';
            badge.style.background = log.isSuccess ? '#28a745' : '#dc3545';
            badge.textContent = log.isSuccess ? 'Thành công' : 'Thất bại';
            tdStatus.appendChild(badge);

            tr.append(tdTime, tdQR, tdGate, tdKhach, tdStatus);
            tbody.appendChild(tr);
        });
    }

    // HELPER
    function styleBase(extra) {
        return `font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin-bottom: 20px; ${extra}`;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    init();
})();