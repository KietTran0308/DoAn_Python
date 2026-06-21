let currentEvent = null;
let seatData = null;
let selectedSeats = []; // Mảng chứa các ghế đang được chọn
let virtualZoneSeats = {}; // Lưu trữ số lượng vé đứng { [id_khu_vuc]: số_lượng }
let subtotalAmount = 0;
let appliedVoucher = null;

const mockVouchers = [
    { CODE: 'WELCOME50', LOAI_GIAM: 'PERCENT', GIA_TRI_GIAM: 50, DIEU_KIEN: 0, GIAM_TOI_DA: 50000 },
    { CODE: 'SUMMER20', LOAI_GIAM: 'PERCENT', GIA_TRI_GIAM: 20, DIEU_KIEN: 100000, GIAM_TOI_DA: 100000 },
    { CODE: 'VIPMINUS500K', LOAI_GIAM: 'AMOUNT', GIA_TRI_GIAM: 500000, DIEU_KIEN: 2000000, GIAM_TOI_DA: 500000 },
    { CODE: 'FREESHIP', LOAI_GIAM: 'AMOUNT', GIA_TRI_GIAM: 20000, DIEU_KIEN: 0, GIAM_TOI_DA: 20000 }
];

document.addEventListener('DOMContentLoaded', () => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
        alert("Vui lòng đăng nhập để tiến hành đặt vé!");
        window.location.href = '../login/Login.html';
        return;
    }

    checkLoginStatus();
    loadBookingData();

    const btnApplyVoucher = document.getElementById('btn-apply-voucher');
    if(btnApplyVoucher) {
        btnApplyVoucher.addEventListener('click', handleApplyVoucher);
    }
});

async function loadBookingData() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = parseInt(urlParams.get('id'));

    if (!eventId) {
        alert("Lỗi: Không tìm thấy mã sự kiện.");
        window.location.href = 'Dashboard.html';
        return;
    }

    try {
        const evRes = await fetch(`http://localhost:8000/api/su-kien/${eventId}`);
        currentEvent = await evRes.json();

        const seatRes = await fetch(`http://localhost:8000/api/events/${eventId}/seats`);
        seatData = await seatRes.json();

        updateCartSummary();
        renderSeatMap();

    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        document.getElementById('zones-container').innerHTML = `<p style="color:#ff6b6b; text-align:center;">Lỗi tải dữ liệu sơ đồ vé.</p>`;
    }
}

// =========================================
// 2. RENDER SƠ ĐỒ HOẶC BẢNG GIÁ VÉ ĐỨNG
// =========================================
function renderSeatMap() {
    const container = document.getElementById('zones-container');
    container.replaceChildren();

    if (!seatData.khu_vuc || seatData.khu_vuc.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <span style="font-size: 40px;">🎪</span>
                <p style="color: #ff6b6b; font-size: 18px; margin-top: 10px; font-weight: bold;">Sự kiện này chưa được mở bán!</p>
                <p style="color: #C7C4D8; font-size: 14px;">(Admin chưa cấu hình và vẽ khu vực bán vé cho sự kiện này)</p>
            </div>`;
        return;
    }

    seatData.khu_vuc.forEach(khu => {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-container';

        const price = khu.HANG_GHE ? formatCurrency(khu.HANG_GHE.GIA_TIEN) : 'Đang cập nhật';
        const zoneColor = khu.MAU_HIEN_THI || '#ffffff';

        zoneDiv.innerHTML = `
            <div class="zone-title" style="color: ${zoneColor}; border-bottom-color: ${zoneColor}40;">
                ${khu.TEN_KV} - ${price}
            </div>
        `;

        // TRƯỜNG HỢP 1: SỰ KIỆN CÓ GHẾ CỐ ĐỊNH (NHÀ HÁT)
        if (khu.LOAI_KV === 'SEATING' && khu.GHE_LIST && khu.GHE_LIST.length > 0) {
            const rows = {};
            khu.GHE_LIST.forEach(ghe => {
                if (!rows[ghe.DAY_GHE]) rows[ghe.DAY_GHE] = [];
                rows[ghe.DAY_GHE].push(ghe);
            });

            for (const [day, listGhe] of Object.entries(rows)) {
                listGhe.sort((a, b) => a.SO_GHE - b.SO_GHE);
                const rowDiv = document.createElement('div');
                rowDiv.className = 'seat-row';

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

                    const status = ghe.TRANG_THAI || 0;
                    if (status !== 0) {
                        seatBtn.classList.add('sold');
                    } else {
                        seatBtn.classList.add('available');
                        seatBtn.addEventListener('click', () => toggleSeat(seatBtn, ghe, khu));
                    }
                    rowDiv.appendChild(seatBtn);
                });
                zoneDiv.appendChild(rowDiv);
            }
        }
        // TRƯỜNG HỢP 2: SỰ KIỆN VÉ ĐỨNG (SÂN VẬN ĐỘNG / ZONE-BASED)
        else {
            const availableQty = khu.SUC_CHUA - (khu.DA_BAN || 0);
            zoneDiv.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-top: 15px; border-left: 5px solid ${zoneColor}">
                    <div>
                        <strong style="color: white; font-size: 16px;">🎟️ Vé đứng (GA)</strong>
                        <p style="color: #C7C4D8; margin: 5px 0 0 0; font-size: 13px;">Sức chứa còn lại: <b>${availableQty}</b> vé</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 8px; border: 1px solid #333;">
                        <button class="btn-qty" onclick="updateZoneQty(${khu.id}, -1)">-</button>
                        <input type="number" id="qty-${khu.id}" value="${virtualZoneSeats[khu.id] || 0}" readonly style="width: 40px; text-align: center; background: transparent; color: white; border: none; font-weight: bold; font-size: 20px;">
                        <button class="btn-qty" onclick="updateZoneQty(${khu.id}, 1, ${availableQty})">+</button>
                    </div>
                </div>
            `;
        }

        container.appendChild(zoneDiv);
    });
}

// Hàm Xử lý tăng giảm số lượng vé Đứng (ZONE_BASED)
window.updateZoneQty = function(kvId, delta, maxAvailable) {
    if (!virtualZoneSeats[kvId]) virtualZoneSeats[kvId] = 0;

    let newQty = virtualZoneSeats[kvId] + delta;
    if (newQty < 0) newQty = 0;

    if (delta > 0) {
        if (selectedSeats.length >= 4) {
            alert("Bạn chỉ được mua tối đa 4 vé trên mỗi giao dịch!");
            return;
        }
        if (maxAvailable !== undefined && newQty > maxAvailable) {
            alert("Đã vượt quá số lượng vé còn lại của khu vực này!");
            return;
        }
    }

    virtualZoneSeats[kvId] = newQty;
    document.getElementById(`qty-${kvId}`).value = newQty;

    rebuildSelectedSeatsFromZones();
};

// =========================================
// 3. XỬ LÝ ĐỒNG BỘ GIỎ HÀNG
// =========================================
// Xử lý Click Ghế Cố Định
function toggleSeat(seatElement, gheData, khuData) {
    const isSelected = seatElement.classList.contains('selected');

    if (isSelected) {
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s.MA_GHE !== gheData.MA_GHE);
    } else {
        if (selectedSeats.length >= 4) {
            alert("Bạn chỉ được chọn tối đa 4 vé trên mỗi giao dịch!");
            return;
        }
        seatElement.classList.add('selected');
        selectedSeats.push({
            ...gheData,
            isVirtual: false,
            TEN_KV: khuData.TEN_KV,
            GIA_TIEN: khuData.HANG_GHE ? khuData.HANG_GHE.GIA_TIEN : 0
        });
    }
    updateCartSummary();
}

// Xử lý Gộp vé Đứng vào giỏ hàng chung
function rebuildSelectedSeatsFromZones() {
    // Giữ lại các ghế ngồi (FIXED_SEAT)
    selectedSeats = selectedSeats.filter(s => !s.isVirtual);

    // Thêm các vé đứng (ZONE_BASED)
    for (const [kvId, qty] of Object.entries(virtualZoneSeats)) {
        if (qty > 0) {
            const khu = seatData.khu_vuc.find(k => k.id == kvId);
            if (khu) {
                for (let i = 0; i < qty; i++) {
                    selectedSeats.push({
                        isVirtual: true,
                        MA_KV: khu.id,
                        TEN_KV: khu.TEN_KV,
                        TEN_GHE: 'Vé Đứng (GA)',
                        GIA_TIEN: khu.HANG_GHE ? khu.HANG_GHE.GIA_TIEN : 0
                    });
                }
            }
        }
    }
    updateCartSummary();
}

// Cập nhật giao diện Giỏ Hàng
function updateCartSummary() {
    if (currentEvent) {
        document.getElementById('cart-ev-title').textContent = currentEvent.TEN_SK;
        const dateObj = new Date(currentEvent.TG_BAT_DAU);
        document.getElementById('cart-ev-time').innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">schedule</span> ${!isNaN(dateObj) ? dateObj.toLocaleDateString('vi-VN') : currentEvent.TG_BAT_DAU}`;
    }

    const cartContainer = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('btn-checkout');

    if (selectedSeats.length === 0) {
        cartContainer.innerHTML = `<p style="color: #6c757d; text-align: center; font-style: italic; margin-top: 15px;">Chưa có ghế/vé nào được chọn.</p>`;
        subtotalAmount = 0;
        appliedVoucher = null;
        document.getElementById('voucher-code').value = '';
        document.getElementById('voucher-msg').textContent = '';

        renderPrices();
        checkoutBtn.disabled = true;
        return;
    }

    cartContainer.replaceChildren();
    subtotalAmount = 0;

    selectedSeats.forEach(seat => {
        subtotalAmount += seat.GIA_TIEN;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <span style="font-weight: bold; color: #ffffff;">${seat.TEN_KV}</span>
                <span style="font-size: 12px; color: #C7C4D8;">Vị trí: ${seat.TEN_GHE}</span>
            </div>
            <div class="cart-item-price">${formatCurrency(seat.GIA_TIEN)}</div>
        `;
        cartContainer.appendChild(itemDiv);
    });

    checkoutBtn.disabled = false;
    checkoutBtn.onclick = handleCheckout;

    if (appliedVoucher) {
        if (subtotalAmount < appliedVoucher.DIEU_KIEN) {
            appliedVoucher = null;
            const msgEl = document.getElementById('voucher-msg');
            msgEl.textContent = `Mã bị hủy do không đủ điều kiện tối thiểu (${formatCurrency(appliedVoucher?.DIEU_KIEN || 0)})`;
            msgEl.style.color = "#ff6b6b";
        }
    }

    renderPrices();
}

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

function handleCheckout() {
    if (selectedSeats.length === 0) return;
    const finalPrice = document.getElementById('cart-total-price').textContent;
    alert(`Cổng thanh toán đang được mở...\nBạn đang mua ${selectedSeats.length} vé.\nTổng thanh toán: ${finalPrice}`);
}

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