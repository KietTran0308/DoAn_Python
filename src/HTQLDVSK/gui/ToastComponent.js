// ToastComponent.js
class ToastManager {

    constructor() {
        // Tạo container chứa các thông báo
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #toast-container {
                position: fixed;
                bottom: 25px;
                right: 25px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none; /* Không chặn click của các phần tử phía dưới nếu không trúng toast */
            }
            .toast-msg {
                min-width: 280px;
                max-width: 400px;
                padding: 16px 20px;
                border-radius: 8px;
                font-family: 'Space Grotesk', Arial, sans-serif;
                font-size: 15px;
                font-weight: bold;
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                transition: opacity 0.3s ease, transform 0.3s ease;
                pointer-events: auto; /* Cho phép click vào chính toast */
            }
            .toast-msg.hiding {
                opacity: 0;
                transform: translateX(100%);
                animation: none;
            }
            /* Bảng màu đồng bộ với thiết kế Admin của bạn */
            .toast-msg.success { background-color: #1dd1a1; color: #100F1A; border-left: 5px solid #100F1A; }
            .toast-msg.error { background-color: #e74c3c; color: #ffffff; border-left: 5px solid #8B0000; }
            .toast-msg.warning { background-color: #f39c12; color: #ffffff; border-left: 5px solid #B8860B; }
            .toast-msg.info { background-color: #7CCDFF; color: #100F1A; border-left: 5px solid #262532; }

            @keyframes slideInRight {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;

        // Gán icon tương ứng với loại thông báo
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `
            <span style="font-size: 18px;">${icon}</span>
            <span style="line-height: 1.4;">${message}</span>
        `;

        this.container.appendChild(toast);

        // Tự động ẩn sau khoảng thời gian duration
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    // Các hàm rút gọn để gọi nhanh
    success(msg) { this.show(msg, 'success'); }
    error(msg) { this.show(msg, 'error', 4000); } // Lỗi thì hiển thị lâu hơn 1 chút
    warning(msg) { this.show(msg, 'warning'); }
    info(msg) { this.show(msg, 'info'); }
}

// Khởi tạo global instance để mọi file JS khác đều có thể gọi được
window.Toast = new ToastManager();