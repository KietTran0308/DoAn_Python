let currentEvent = null;
let seatData = null;
let selectedSeats = []; // Mảng chứa các ghế đang được chọn
let subtotalAmount = 0;
let appliedVoucher = null;

const mockVouchers = [
    { CODE: 'WELCOME50', LOAI_GIAM: 'PERCENT', GIA_TRI_GIAM: 50, DIEU_KIEN: 0, GIAM_TOI_DA: 50000 },
    { CODE: 'SUMMER20', LOAI_GIAM: 'PERCENT', GIA_TRI_GIAM: 20, DIEU_KIEN: 100000, GIAM_TOI_DA: 100000 },
    { CODE: 'VIPMINUS500K', LOAI_GIAM: 'AMOUNT', GIA_TRI_GIAM: 500000, DIEU_KIEN: 2000000, GIAM_TOI_DA: 500000 },
    { CODE: 'FREESHIP', LOAI_GIAM: 'AMOUNT', GIA_TRI_GIAM: 20000, DIEU_KIEN: 0, GIAM_TOI_DA: 20000 }
];

document.addEventListener('DOMContentLoaded', () => {
    // BẮT BUỘC ĐĂNG NHẬP: Kiểm tra ngay khi vào trang Đặt vé
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
        alert("Vui lòng đăng nhập để tiến hành đặt vé!");
        window.location.href = '../login/Login.html';
        return;
    }

    // Render Header User
    checkLoginStatus();
    loadBookingData();

    const btnApplyVoucher = document.getElementById('btn-apply-voucher');
    if(btnApplyVoucher) {
        btnApplyVoucher.addEventListener('click', handleApplyVoucher);
    }
});

// =========================================
// 1. TẢI DỮ LIỆU SỰ KIỆN VÀ SƠ ĐỒ GHẾ
// =========================================
async function loadBookingData() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = parseInt(urlParams.get('id'));

    if (!eventId) {
        alert("Lỗi: Không tìm thấy mã sự kiện.");
        window.location.href = 'Dashboard.html';
        return;
    }

    try {
        // Tải thông tin tổng quan Sự kiện
        const evRes = await fetch(`http://localhost:8000/api/su-kien/${eventId}`);
        currentEvent = await evRes.json();

        // Tải dữ liệu Sơ đồ ghế (Khu vực, Hạng vé, Ghế)
        const seatRes = await fetch(`http://localhost:8000/api/events/${eventId}/seats`);
        seatData = await seatRes.json();

        updateCartSummary();
        renderSeatMap();

    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        document.getElementById('zones-container').innerHTML = `<p style="color:#ff6b6b; text-align:center;">Lỗi tải dữ liệu sơ đồ ghế.</p>`;
    }
}

// =========================================
// 2. RENDER SƠ ĐỒ GHẾ
// =========================================
function renderSeatMap() {
    const container = document.getElementById('zones-container');
    container.replaceChildren();

    if (!seatData.khu_vuc || seatData.khu_vuc.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #C7C4D8;">Sự kiện này chưa được thiết lập sơ đồ ghế.</p>`;
        return;
    }

    seatData.khu_vuc.forEach(khu => {
        // Tạo khối Khu Vực (Zone)
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-container';

        // Tiêu đề khu vực kèm giá tiền
        const price = khu.HANG_GHE ? formatCurrency(khu.HANG_GHE.GIA_TIEN) : 'Đang cập nhật';
        const zoneColor = khu.MAU_HIEN_THI || '#ffffff';

        zoneDiv.innerHTML = `
            <div class="zone-title" style="color: ${zoneColor}; border-bottom-color: ${zoneColor}40;">
                ${khu.TEN_KV} - ${price}
            </div>
        `;

        if (khu.GHE_LIST && khu.GHE_LIST.length > 0) {
            // Gom nhóm ghế theo Dãy (DAY_GHE)
            const rows = {};
            khu.GHE_LIST.forEach(ghe => {
                if (!rows[ghe.DAY_GHE]) rows[ghe.DAY_GHE] = [];
                rows[ghe.DAY_GHE].push(ghe);
            });

            // Vẽ từng dãy ghế
            for (const [day, listGhe] of Object.entries(rows)) {
                // Sắp xếp ghế theo số
                listGhe.sort((a, b) => a.SO_GHE - b.SO_GHE);

                const rowDiv = document.createElement('div');
                rowDiv.className = 'seat-row';

                // Tên dãy ở đầu dòng
                const rowLabel = document.createElement('div');
                rowLabel.style.width = '30px';
                rowLabel.style.color = '#C7C4D8';
                rowLabel.style.display = 'flex';
                rowLabel.style.alignItems = 'center';
                rowLabel.textContent = day;
                rowDiv.appendChild(rowLabel);

                listGhe.forEach(ghe => {
                    const seatBtn = document.createElement('div');
                    seatBtn.className = 'seat';
                    seatBtn.textContent = ghe.SO_GHE;

                    // Giả lập trạng thái (Nếu API có trường TRANG_THAI, ta sẽ dùng nó. Hiện tại mặc định là available)
                    const status = ghe.TRANG_THAI || 0; // 0: Trống, 1: Giữ, 2: Đã bán

                    if (status !== 0) {
                        seatBtn.classList.add('sold');
                    } else {
                        seatBtn.classList.add('available');
                        // Nếu là ghế trống, cấp quyền cho click
                        seatBtn.addEventListener('click', () => toggleSeat(seatBtn, ghe, khu));
                    }

                    rowDiv.appendChild(seatBtn);
                });

                zoneDiv.appendChild(rowDiv);
            }
        } else {
            // Dành cho khu vực vé đứng (Không chia ghế chi tiết)
            zoneDiv.innerHTML += `<p style="text-align:center; color:#C7C4D8;">Khu vực vé đứng (GA). Vui lòng chọn số lượng ở giỏ hàng.</p>`;
        }

        container.appendChild(zoneDiv);
    });
}

// =========================================
// 3. XỬ LÝ CHỌN GHẾ
// =========================================
function toggleSeat(seatElement, gheData, khuData) {
    const isSelected = seatElement.classList.contains('selected');

    if (isSelected) {
        // Bỏ chọn
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s.MA_GHE !== gheData.MA_GHE);
    } else {
        // Kiểm tra giới hạn mua vé (VD: Tối đa 4 vé)
        if (selectedSeats.length >= 4) {
            alert("Bạn chỉ được chọn tối đa 4 vé trên mỗi giao dịch!");
            return;
        }

        // Chọn ghế
        seatElement.classList.add('selected');
        selectedSeats.push({
            ...gheData,
            TEN_KV: khuData.TEN_KV,
            GIA_TIEN: khuData.HANG_GHE ? khuData.HANG_GHE.GIA_TIEN : 0
        });
    }

    updateCartSummary();
}

// =========================================
// 4. CẬP NHẬT GIỎ HÀNG
// =========================================
function updateCartSummary() {
    // 1. Cập nhật thông tin sự kiện
    if (currentEvent) {
        document.getElementById('cart-ev-title').textContent = currentEvent.TEN_SK;
        const dateObj = new Date(currentEvent.TG_BAT_DAU);
        document.getElementById('cart-ev-time').innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">schedule</span> ${!isNaN(dateObj) ? dateObj.toLocaleDateString('vi-VN') : currentEvent.TG_BAT_DAU}`;
    }

    const cartContainer = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('btn-checkout');

    // Nếu chưa chọn vé
    if (selectedSeats.length === 0) {
        cartContainer.innerHTML = `<p style="color: #6c757d; text-align: center; font-style: italic; margin-top: 15px;">Chưa có ghế nào được chọn.</p>`;
        subtotalAmount = 0;
        appliedVoucher = null; // Hủy voucher nếu bỏ hết vé
        document.getElementById('voucher-code').value = '';
        document.getElementById('voucher-msg').textContent = '';

        renderPrices();
        checkoutBtn.disabled = true;
        return;
    }

    // Nếu có chọn vé
    cartContainer.replaceChildren();
    subtotalAmount = 0;

    selectedSeats.forEach(seat => {
        subtotalAmount += seat.GIA_TIEN;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <span style="font-weight: bold; color: #ffffff;">${seat.TEN_KV}</span>
                <span style="font-size: 12px; color: #C7C4D8;">Ghế: ${seat.TEN_GHE}</span>
            </div>
            <div class="cart-item-price">${formatCurrency(seat.GIA_TIEN)}</div>
        `;
        cartContainer.appendChild(itemDiv);
    });

    checkoutBtn.disabled = false;
    checkoutBtn.onclick = handleCheckout;

    // Tính toán lại voucher nếu tổng tiền bị thay đổi do thêm/bớt vé
    if (appliedVoucher) {
        if (subtotalAmount < appliedVoucher.DIEU_KIEN) {
            appliedVoucher = null; // Đơn hàng không còn đủ điều kiện
            const msgEl = document.getElementById('voucher-msg');
            msgEl.textContent = `Mã bị hủy do không đủ điều kiện tối thiểu (${formatCurrency(appliedVoucher?.DIEU_KIEN || 0)})`;
            msgEl.style.color = "#ff6b6b";
        }
    }

    renderPrices();
}

// Xử lý nút Apply Voucher
function handleApplyVoucher() {
    const codeInput = document.getElementById('voucher-code').value.trim().toUpperCase();
    const msgEl = document.getElementById('voucher-msg');

    if (selectedSeats.length === 0) {
        msgEl.textContent = "Vui lòng chọn ghế trước khi nhập mã.";
        msgEl.style.color = "#ff6b6b";
        return;
    }

    if (!codeInput) {
        msgEl.textContent = "Vui lòng nhập mã giảm giá.";
        msgEl.style.color = "#ff6b6b";
        return;
    }

    // Tìm voucher trong database mô phỏng
    const voucher = mockVouchers.find(v => v.CODE === codeInput);

    if (!voucher) {
        msgEl.textContent = "Mã giảm giá không hợp lệ hoặc không tồn tại.";
        msgEl.style.color = "#ff6b6b";
        appliedVoucher = null;
    } else if (subtotalAmount < voucher.DIEU_KIEN) {
        msgEl.textContent = `Đơn hàng chưa đạt giá trị tối thiểu (${formatCurrency(voucher.DIEU_KIEN)}).`;
        msgEl.style.color = "#ff6b6b";
        appliedVoucher = null;
    } else {
        appliedVoucher = voucher;
        msgEl.textContent = "🎉 Áp dụng mã thành công!";
        msgEl.style.color = "#1dd1a1";
    }

    renderPrices();
}

// Vẽ lại Tạm tính, Giảm giá và Tổng tiền
function renderPrices() {
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountLine = document.getElementById('discount-line');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total-price');

    subtotalEl.textContent = formatCurrency(subtotalAmount);

    let discountAmount = 0;

    if (appliedVoucher) {
        if (appliedVoucher.LOAI_GIAM === 'PERCENT') {
            discountAmount = subtotalAmount * (appliedVoucher.GIA_TRI_GIAM / 100);
        } else if (appliedVoucher.LOAI_GIAM === 'AMOUNT') {
            discountAmount = appliedVoucher.GIA_TRI_GIAM;
        }

        // Kiểm tra mức giảm tối đa
        if (appliedVoucher.GIAM_TOI_DA && discountAmount > appliedVoucher.GIAM_TOI_DA) {
            discountAmount = appliedVoucher.GIAM_TOI_DA;
        }

        discountLine.style.display = 'flex';
        discountEl.textContent = `-${formatCurrency(discountAmount)}`;
    } else {
        discountLine.style.display = 'none';
    }

    const finalTotal = subtotalAmount - discountAmount;
    totalEl.textContent = formatCurrency(finalTotal > 0 ? finalTotal : 0);
}

// =========================================
// 5. THANH TOÁN (MÔ PHỎNG)
// =========================================
function handleCheckout() {
    if (selectedSeats.length === 0) return;
    const finalPrice = document.getElementById('cart-total-price').textContent;
    alert(`Cổng thanh toán đang được mở...\nBạn đang mua ${selectedSeats.length} vé.\nTổng thanh toán: ${finalPrice}`);
}

// =========================================
// HÀM TIỆN ÍCH
// =========================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function checkLoginStatus() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    const userStr = sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.ho_ten)}&background=random`;

        authContainer.innerHTML = `
            <button class="user-profile-btn">
                <img src="${avatarUrl}" alt="User Avatar">
                <span>${user.ho_ten}</span>
            </button>
            <div class="user-dropdown">
                <a href="#">👤 Hồ sơ cá nhân</a>
                <a href="user/MyTickets.html">🎟️ Quản lý vé</a>
                <a href="#" id="btn-logout" class="logout-btn">🚪 Đăng xuất</a>
            </div>
        `;
        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('user');
            window.location.reload();
        });
    }
}
