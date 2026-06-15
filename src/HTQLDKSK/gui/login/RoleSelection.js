document.addEventListener('DOMContentLoaded', () => {
    // Lấy thông tin user từ session
    const userStr = sessionStorage.getItem('user');

    // Nếu chưa đăng nhập, đá về trang Login
    if (!userStr) {
        window.location.href = 'Login.html';
        return;
    }

    const user = JSON.parse(userStr);
    const customerRoles = ['Customer', 'VIP Customer', 'Guest'];

    // Bảo mật: Nếu khách hàng "đi lạc" vào URL trang này, đá về Dashboard
    if (customerRoles.includes(user.quyen)) {
        window.location.href = '../dashboard/Dashboard.html';
        return;
    }

    // Hiển thị lời chào sử dụng textContent thuần DOM
    const greetingEl = document.getElementById('user-greeting');
    if (greetingEl) {
        greetingEl.textContent = `Xin chào, ${user.ho_ten} (${user.quyen})! Vui lòng chọn không gian làm việc:`;
    }

    // Gắn sự kiện điều hướng
    const btnDashboard = document.getElementById('btn-dashboard');
    if (btnDashboard) {
        btnDashboard.addEventListener('click', () => {
            window.location.href = '../dashboard/Dashboard.html';
        });
    }

    const btnAdmin = document.getElementById('btn-admin');
    if (btnAdmin) {
        btnAdmin.addEventListener('click', () => {
            window.location.href = '../admin/Admin.html';
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('user');
            window.location.href = 'Login.html';
        });
    }
});