(() => {
    const API = 'http://localhost:5000';

    // Lấy thông tin nhân viên từ session
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const maTKNhanVien = user.ma_tk || 6; // fallback cho dev

    function init() {
        loadDanhSachSuKien();
        // Focus vào input QR ngay khi load
        setTimeout(() => {
            const qrInput = document.getElementById('qr-input');
            if (qrInput) qrInput.focus();
        }, 100);
    }

    // Load danh sách sự kiện vào dropdown
    async function loadDanhSachSuKien() {
        try {
            const res = await fetch(`${API}/api/su-kien`);
            const data = await res.json();
            const select = document.getElementById('filter-su-kien');
            if (!select) return;

            data.forEach(sk => {
                const opt = document.createElement('option');
                opt.value = sk.MA_SK;
                opt.textContent = sk.TEN_SK;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error('Lỗi load sự kiện:', e);
        }
    }

    // Xử lý quét QR
    window.submitQR = async function () {
        const qrInput = document.getElementById('qr-input');
        const tenCong = document.getElementById('ten-cong').value;
        const btn = document.getElementById('scan-btn');
        const qrCode = qrInput.value.trim();

        if (!qrCode) {
            showResult(null, 'Vui lòng nhập mã QR!', 'warn');
            return;
        }

        btn.disabled = true;
        btn.textContent = '⏳ Đang xử lý...';

        try {
            const res = await fetch(`${API}/api/checkin/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_code: qrCode,
                    ma_tk: maTKNhanVien,
                    ten_cong: tenCong
                })
            });

            const data = await res.json();
            showResult(data, null, data.hop_le ? 'success' : 'error');

            // Nếu thành công, tự reload lịch sử
            if (data.hop_le) {
                const maSK = document.getElementById('filter-su-kien').value;
                if (maSK) setTimeout(loadLichSu, 500);
            }

        } catch (e) {
            showResult(null, 'Không kết nối được server!', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '✔ Xác nhận';
            qrInput.value = '';
            qrInput.focus();
        }
    };

    // Hiển thị kết quả quét
    function showResult(data, msg, type) {
        const card = document.getElementById('scan-result-content');
        if (!card) return;

        const colors = {
            success: { bg: 'rgba(76, 175, 80, 0.15)', border: '#4caf50', icon: '✅', text: '#4caf50' },
            error:   { bg: 'rgba(244, 67, 54, 0.15)', border: '#f44336', icon: '❌', text: '#f44336' },
            warn:    { bg: 'rgba(255, 193, 7, 0.15)',  border: '#ffc107', icon: '⚠️', text: '#ffc107' }
        };
        const c = colors[type];

        if (!data) {
            card.innerHTML = `
                <div style="text-align:center; width:100%;">
                    <div style="font-size:48px; margin-bottom:12px;">${c.icon}</div>
                    <div style="color:${c.text}; font-size:16px; font-weight:600;">${msg}</div>
                </div>`;
            return;
        }

        card.innerHTML = `
            <div style="width:100%; background:${c.bg}; border:1px solid ${c.border};
                        border-radius:10px; padding:20px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                    <span style="font-size:32px;">${c.icon}</span>
                    <div>
                        <div style="color:${c.text}; font-size:18px; font-weight:700;">${data.tin_nhan}</div>
                    </div>
                </div>
                ${data.hop_le ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
                    <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:12px;">
                        <div style="color:rgba(255,255,255,0.5); font-size:11px; margin-bottom:4px;">KHÁCH HÀNG</div>
                        <div style="color:white; font-size:15px; font-weight:600;">${data.ten_khach || '—'}</div>
                        <div style="color:rgba(255,255,255,0.5); font-size:12px;">${data.email || ''}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:12px;">
                        <div style="color:rgba(255,255,255,0.5); font-size:11px; margin-bottom:4px;">SỰ KIỆN</div>
                        <div style="color:white; font-size:15px; font-weight:600;">${data.ten_su_kien || '—'}</div>
                        <div style="color:#80ceff; font-size:13px;">${data.gia_ve ? data.gia_ve.toLocaleString('vi-VN') + ' đ' : ''}</div>
                    </div>
                </div>` : ''}
            </div>`;
    }

    // Load lịch sử check-in
    window.loadLichSu = async function () {
        const maSK = document.getElementById('filter-su-kien').value;
        if (!maSK) return;

        const tbody = document.getElementById('lich-su-tbody');
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:rgba(255,255,255,0.4);">⏳ Đang tải...</td></tr>`;

        try {
            const res = await fetch(`${API}/api/checkin/logs?ma_sk=${maSK}`);
            const data = await res.json();
            renderLichSu(data);
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:#f44336;">Lỗi tải dữ liệu</td></tr>`;
        }
    };

    function renderLichSu(data) {
        const tbody = document.getElementById('lich-su-tbody');
        const statsBar = document.getElementById('stats-bar');

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);">Chưa có lượt check-in nào</td></tr>`;
            statsBar.style.display = 'none';
            return;
        }

        // Thống kê
        const total = data.length;
        const success = data.filter(r => r.trang_thai === 'Thành công').length;
        const fail = total - success;

        statsBar.style.display = 'flex';
        document.getElementById('stat-total').textContent = `Tổng: ${total} lượt`;
        document.getElementById('stat-success').textContent = `✅ Thành công: ${success}`;
        document.getElementById('stat-fail').textContent = `❌ Thất bại: ${fail}`;

        tbody.replaceChildren();
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;';
            tr.onmouseenter = () => tr.style.background = 'rgba(255,255,255,0.03)';
            tr.onmouseleave = () => tr.style.background = '';

            const isSuccess = row.trang_thai === 'Thành công';

            tr.innerHTML = `
                <td style="padding:12px 16px; color:rgba(255,255,255,0.7); font-size:13px; white-space:nowrap;">${row.tg_quet}</td>
                <td style="padding:12px 16px;">
                    <div style="color:white; font-size:14px; font-weight:500;">${row.ten_khach}</div>
                    <div style="color:rgba(255,255,255,0.4); font-size:12px;">${row.email}</div>
                </td>
                <td style="padding:12px 16px; color:rgba(255,255,255,0.6); font-size:13px;">${row.ten_cong || '—'}</td>
                <td style="padding:12px 16px; text-align:center;">
                    <span style="background:${isSuccess ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)'};
                                 color:${isSuccess ? '#4caf50' : '#f44336'};
                                 padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600;">
                        ${isSuccess ? '✓' : '✗'}
                    </span>
                </td>`;

            tbody.appendChild(tr);
        });
    }

    init();
})();