const API_BASE = 'http://localhost:5000';

// Toggle hiện/ẩn mật khẩu
document.querySelector('.toggle-password')?.addEventListener('click', function () {
    const input = document.getElementById('password');
    const icon = this;
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility_off';
    }
});

// Hiển thị thông báo lỗi/thành công
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

// Submit đăng nhập
document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const ten_tk = document.getElementById('email').value.trim();
    const mat_khau = document.getElementById('password').value;
    const btn = this.querySelector('button[type="submit"]');

    if (!ten_tk || !mat_khau) {
        showMessage('Vui lòng nhập đầy đủ thông tin.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'ĐANG XỬ LÝ...';

    try {
        const res = await fetch(`${API_BASE}/api/dang-nhap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ten_tk, mat_khau })
        });

        const data = await res.json();

        if (data.success) {
            // Lưu thông tin vào sessionStorage
            sessionStorage.setItem('user', JSON.stringify(data.data));
            showMessage('Đăng nhập thành công! Đang chuyển hướng...', false);
            setTimeout(() => {
                window.location.href = '../dashboard/Dashboard.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Đăng nhập thất bại.');
        }
    } catch (err) {
        showMessage('Không kết nối được server. Vui lòng thử lại.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'ĐĂNG NHẬP NGAY';
    }
});