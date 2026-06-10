const API_BASE = 'http://localhost:5000';

// Hiển thị thông báo
function showMessage(msg, isError = true) {
    let el = document.getElementById('msg-box');
    if (!el) {
        el = document.createElement('div');
        el.id = 'msg-box';
        el.className = 'rounded-lg px-4 py-3 text-sm font-body-md mb-4';
        document.querySelector('form').prepend(el);
    }
    el.textContent = msg;
    el.className = `rounded-lg px-4 py-3 text-sm font-body-md mb-4 ${isError
        ? 'bg-error-container text-on-error-container'
        : 'bg-tertiary-container text-on-tertiary-container'}`;
}

// Submit đăng ký
document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const ho_ten = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const sdt = document.getElementById('phone').value.trim();
    const mat_khau = document.getElementById('password').value;
    const xac_nhan = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms').checked;
    const btn = this.querySelector('button[type="submit"]');

    // Validate
    if (!ho_ten || !email || !sdt || !mat_khau || !xac_nhan) {
        showMessage('Vui lòng nhập đầy đủ thông tin.');
        return;
    }
    if (mat_khau !== xac_nhan) {
        showMessage('Mật khẩu xác nhận không khớp.');
        return;
    }
    if (mat_khau.length < 6) {
        showMessage('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }
    if (!terms) {
        showMessage('Vui lòng đồng ý với điều khoản dịch vụ.');
        return;
    }

    // Tách họ và tên (từ cuối là tên, còn lại là họ)
    const parts = ho_ten.split(' ');
    const ten = parts.pop();
    const ho = parts.join(' ') || ten;

    // Dùng email làm tên tài khoản
    const ten_tk = email;

    btn.disabled = true;
    btn.textContent = 'ĐANG XỬ LÝ...';

    try {
        const res = await fetch(`${API_BASE}/api/dang-ky`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ten_tk, mat_khau, ho, ten, email, sdt })
        });

        const data = await res.json();

        if (data.success) {
            showMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...', false);
            setTimeout(() => {
                window.location.href = 'Login.html';
            }, 1500);
        } else {
            showMessage(data.message || 'Đăng ký thất bại.');
        }
    } catch (err) {
        showMessage('Không kết nối được server. Vui lòng thử lại.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'ĐĂNG KÝ';
    }
});